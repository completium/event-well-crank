import { RpcClient, OpKind, OperationContentsAndResultTransaction, InternalOperationResult, MichelsonV1ExpressionBase, BlockResponse } from '@taquito/rpc';
import { ShaftEvent, ShaftEventCreator, ShaftEventProcessor, ShaftEventDefinition, IndexerOptions } from './types';
import { sleep, defaultIndexerOptions } from './utils';

let delay   = defaultIndexerOptions.delay
let horizon = defaultIndexerOptions.horizon
let shaft   = defaultIndexerOptions.shaft
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

/**
 *
 * @param internalOp block response to process.
 * @description Executes event processors on internal operation
 *
 */
function processInternalOp(internalOp : InternalOperationResult) {
  eventDefinitions.forEach((eventDef : ShaftEventDefinition<any>) => {
    if (internalOp.source === eventDef.source && internalOp.destination === shaft) {
      if (internalOp.parameters !== undefined) {
        const packedEvent = (internalOp.parameters.value as MichelsonV1ExpressionBase).bytes
        if (packedEvent !== undefined) {
          const event = eventDef.create(packedEvent);
          if (event !== undefined) {
            eventDef.process(event)
          }
        }
      }
    }
  })
}

/**
 *
 * @param block block response to process.
 * @description Processes block's internal operations
 *
 */
export async function processBlock(block : BlockResponse) {
  block.operations.forEach(opentry => {
    opentry.forEach(op => {
      op.contents.forEach(opcontent => {
        if (opcontent.kind === OpKind.TRANSACTION) {
          const internalops = (opcontent as OperationContentsAndResultTransaction).metadata.internal_operation_results
          if (internalops !== undefined) {
            internalops.forEach(processInternalOp)
          }
        }
      })
    })
  })
}

/**
 *
 * @param bottom block response to stop crawling at.
 * @description Crawls down blocks from head to bottom (bottom is NOT crawled)
 *
 */
async function crawl(bottom : BlockResponse) {
  let current : BlockResponse = await client.getBlock({ block: `"head~${horizon}` })
  while (bottom.hash !== current.hash) {
    await processBlock(current)
    current = await client.getBlock({ block : current.header.predecessor })
    await sleep(delay)
  }
}

/**
 *
 * @param options indexer options
 * @description Starts the event indexer
 *
 */
export async function run(options ?: IndexerOptions) {
}