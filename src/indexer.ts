import { RpcClient, OpKind, OperationContentsAndResultTransaction, InternalOperationResult, MichelsonV1ExpressionBase, BlockResponse } from '@taquito/rpc';
import { ShaftEvent, ShaftEventCreator, ShaftEventProcessor, ShaftEventDefinition, IndexerOptions } from './types';
import { sleep, defaultIndexerOptions } from './utils';

let delay   = defaultIndexerOptions.delay
let horizon = defaultIndexerOptions.horizon
let shaft   = defaultIndexerOptions.shaft
let bottom  = defaultIndexerOptions.bottom
let client  = new RpcClient(defaultIndexerOptions.endpoint);

const eventDefinitions : Array<ShaftEventDefinition<any>> = []

/**
 *
 * @param s source, address of the event emitter contract
 * @param c creator, shaft event creator function (provided by binding generator)
 * @param p processor, your shaft event processor
 * @description Registers an event definition in indexer
 *
 */
export function register<T extends ShaftEvent>(s : string, c : ShaftEventCreator<T>, p : ShaftEventProcessor<T>) : void {
  eventDefinitions.push({ source : s, create : c, process : p })
}

type ApplyShaftEventProcessor<T> = {
  process : ShaftEventProcessor<T>
  event   : T
}

/**
 *
 * @param internalOp block response to process.
 * @description Executes event processors on internal operation
 *
 */
function processInternalOp(internalOp : InternalOperationResult) : Array<ApplyShaftEventProcessor<any>> {
  let apps : Array<ApplyShaftEventProcessor<any>> = []
  eventDefinitions.forEach((eventDef : ShaftEventDefinition<any>) => {
    if (internalOp.source === eventDef.source && internalOp.destination === shaft) {
      if (internalOp.parameters !== undefined) {
        const packedEvent = (internalOp.parameters.value as MichelsonV1ExpressionBase).bytes
        if (packedEvent !== undefined) {
          const event = eventDef.create(packedEvent);
          if (event !== undefined) {
            apps.push({ process : eventDef.process, event : event })
            eventDef.process(event)
          }
        }
      }
    }
  })
  return apps
}

/**
 *
 * @param block block response to process.
 * @description Processes block's internal operations
 *
 */
export function processBlock(block : BlockResponse) : Array<ApplyShaftEventProcessor<any>> {
  let apps : Array<ApplyShaftEventProcessor<any>> = []
  block.operations.forEach(opentry => {
    opentry.forEach(op => {
      op.contents.forEach(opcontent => {
        if (opcontent.kind === OpKind.TRANSACTION) {
          const internalops = (opcontent as OperationContentsAndResultTransaction).metadata.internal_operation_results
          if (internalops !== undefined) {
            internalops.forEach(internalop => {
              apps = apps.concat(processInternalOp(internalop))
            })
          }
        }
      })
    })
  })
  return apps
}

const MAX_PROCESSED = 1000

/**
 *
 * @param bottom block response to stop crawling at.
 * @description Crawls down blocks from head to bottom (bottom is NOT crawled)
 *
 */
async function crawl(bottom : BlockResponse) : Promise<string> {
  let current : BlockResponse = await client.getBlock({ block: `head~${horizon}` })
  let nextBottom = current.hash
  let nbProcessed = 0
  let apps : Array<ApplyShaftEventProcessor<any>> = []
  while (bottom.hash !== current.hash && nbProcessed++ < MAX_PROCESSED) {
    console.log("processing block " + current.hash + " ...")
    let blockApps = processBlock(current)
    apps = blockApps.concat(apps)
    current = await client.getBlock({ block : current.header.predecessor })
  }
  apps.forEach(app => {
    app.process(app.event)
  })
  return nextBottom
}

let _stop = false

/**
 *
 * @param options indexer options
 * @description Starts the event indexer
 *
 */
export async function run(options ?: IndexerOptions) {
  if (options !== undefined) {
    delay   = options.delay   ?? delay
    horizon = options.horizon ?? horizon
    shaft   = options.shaft   ?? shaft
    bottom  = options.bottom  ?? bottom
    if (options.endpoint !== undefined) {
      client = new RpcClient(options.endpoint)
    }
  }
  let bottomBlock : BlockResponse = await client.getBlock({ block: bottom })
  do {
    let newBottom = await crawl(bottomBlock)
    await sleep(delay)
    bottomBlock = await client.getBlock({ block: newBottom })
  } while (!_stop)
}

export function stop() {
  _stop = true
}