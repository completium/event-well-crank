import { BlockResponse, InternalOperationResult, MichelsonV1ExpressionBase, OperationContentsAndResultTransaction, OpKind, RpcClient } from '@taquito/rpc';

import { WellEventData, CrankOptions, WellEvent, WellEventCreator, WellEventDefinition, WellEventProcessor } from './types';
import { defaultIndexerOptions, sleep } from './utils';

let delay   = defaultIndexerOptions.delay
let horizon = defaultIndexerOptions.horizon
let well    = defaultIndexerOptions.well
let bottom  = defaultIndexerOptions.bottom
let client  = new RpcClient(defaultIndexerOptions.endpoint);

const eventDefinitions : Array<WellEventDefinition<any>> = []
const eventDefinitionSet : Set<string> = new Set()

/**
 *
 * @param s source, address of the event emitter contract
 * @param c creator, well event creator function (provided by binding generator)
 * @param p processor, your well event processor
 * @description Registers an event definition in indexer
 *
 */
export function registerEvent<T extends WellEvent>(
{ s, c, p }: { s: string; c: WellEventCreator<T>; p: WellEventProcessor<T>; }) : void {
  const key = s + c.toString() + p.toString()
  if (eventDefinitionSet.has(key)) {
    return
  }
  eventDefinitions.push({ source : s, create : c, process : p })
  eventDefinitionSet.add(key)
}

type ApplyProcessor<T extends WellEvent> = {
  process : WellEventProcessor<T>
  event   : T
  data    : WellEventData
}

/**
 *
 * @param internalOp block response to process.
 * @description Executes event processors on internal operation
 *
 */
function processInternalOp(internalOp : InternalOperationResult, data : Omit<WellEventData, 'source'>) : Array<ApplyProcessor<any>> {
  let apps : Array<ApplyProcessor<any>> = []
  eventDefinitions.forEach((eventDef : WellEventDefinition<any>) => {
    if (internalOp.source === eventDef.source && internalOp.destination === well) {
      if (internalOp.parameters !== undefined) {
        const packedEvent = (internalOp.parameters.value as MichelsonV1ExpressionBase).bytes
        if (packedEvent !== undefined) {
          const event = eventDef.create(packedEvent);
          if (event !== undefined) {
            apps.push({ process : eventDef.process, event : event, data  : { ...data, source : eventDef.source } })
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
export function processBlock(block : BlockResponse) : Array<ApplyProcessor<any>> {
  let apps : Array<ApplyProcessor<any>> = []
  block.operations.forEach(opentry => {
    opentry.forEach(op => {
      let data : Omit<WellEventData, 'source'> = { block : block.hash, op : op.hash, time : block.header.timestamp.toString() }
      op.contents.forEach(opcontent => {
        if (opcontent.kind === OpKind.TRANSACTION) {
          const internalops = (opcontent as OperationContentsAndResultTransaction).metadata.internal_operation_results
          if (internalops !== undefined) {
            internalops.forEach(internalop => {
              apps = apps.concat(processInternalOp(internalop, data))
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
  let apps : Array<ApplyProcessor<any>> = []
  while (bottom.hash !== current.hash && nbProcessed++ < MAX_PROCESSED) {
    console.log("processing block " + current.hash + " ...")
    let blockApps = processBlock(current)
    apps = blockApps.concat(apps)
    current = await client.getBlock({ block : current.header.predecessor })
  }
  apps.forEach(app => {
    app.process(app.event, app.data)
  })
  return nextBottom
}

let _stop = false
let _running = false

let running_bottom : string | undefined = undefined

/**
 *
 * @param options indexer options
 * @description Starts the event indexer
 *
 */
export async function runCrank(options ?: CrankOptions) {
  if (_running) {
    return
  }
  console.log("Starting tezos event listener ...")
  _running = true
  _stop = false
  bottom = running_bottom ?? bottom
  if (options !== undefined) {
    delay   = options.delay   ?? delay
    horizon = options.horizon ?? horizon
    well   = options.well   ?? well
    bottom  = options.bottom  ?? bottom
    if (options.endpoint !== undefined) {
      client = new RpcClient(options.endpoint)
    }
  }
  let bottomBlock : BlockResponse = await client.getBlock({ block: bottom })
  do {
    let newBottom = await crawl(bottomBlock)
    running_bottom = newBottom
    await sleep(delay)
    bottomBlock = await client.getBlock({ block: newBottom })
  } while (!_stop)
  _running = false
  console.log("Tezos event listener stopped.")
}

export function stop() {
  _stop = true
}