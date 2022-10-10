import { MichelsonType, Parser } from '@taquito/michel-codec';
import { BlockResponse, InternalOperationResult, MichelsonV1ExpressionBase, OperationContentsAndResultTransaction, OpKind, RpcClient } from '@taquito/rpc';

import { CrankOptions, UnpackedEvent, WellEvent, WellEventData, WellEventDefinition, WellEventFilter, WellEventProcessor } from './types';
import { defaultIndexerOptions, hex_to_data, sleep } from './utils';

let delay   = defaultIndexerOptions.delay
let horizon = defaultIndexerOptions.horizon
let bottom  = defaultIndexerOptions.bottom
let client  = new RpcClient(defaultIndexerOptions.endpoint);
let verbose = defaultIndexerOptions.verbose

const eventDefinitions : Array<WellEventDefinition<any>> = []
const eventDefinitionSet : Set<string> = new Set()

const dump = (s : string) => {
  if (verbose) {
    console.log(s)
  }
}

const genericEventMichelsonType: MichelsonType =
{  "prim": "pair",
   "args": [
     {  "prim": "string",
        "annots": [
          "%_kind"
        ]
     },
     {  "prim": "pair",
        "args": [
          {  "prim": "string",
             "annots": [
               "%_type"
             ]
          },
          {  "prim": "bytes",
             "annots": [
               "%_event"
             ]
          }
        ]
     }
   ]
};

const createEvent = (packedEvent : string, filter : WellEventFilter) : UnpackedEvent | undefined => {
  const data = hex_to_data(genericEventMichelsonType, packedEvent);
  if (! filter(data._kind)) return undefined;
  const eventTypeStr = data._type;
  const michelsonExpr = (new Parser()).parseMichelineExpression(eventTypeStr.toString());
  const michelsonType : MichelsonType = JSON.parse(JSON.stringify(michelsonExpr));
  return {
    _kind : data._kind,
    _event : hex_to_data(michelsonType, data._event)
  }
}

/**
 *
 * @param s source, address of the event emitter contract
 * @param c creator, well event creator function (provided by binding generator)
 * @param p processor, your well event processor
 * @description Registers an event definition in indexer
 *
 */
export function registerEvent<T extends WellEvent>(
{ source, filter, process }: { source: string; filter : WellEventFilter, process: WellEventProcessor<T>; }) : void {
  const key = source + filter.toString() + process.toString()
  if (eventDefinitionSet.has(key)) {
    return
  }
  eventDefinitions.push({ source : source, filter : filter, process : process })
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
function processInternalOp(internalOp : InternalOperationResult, data : Omit<WellEventData, 'source' | 'evtype'>) : Array<ApplyProcessor<any>> {
  let apps : Array<ApplyProcessor<any>> = []
  eventDefinitions.forEach((eventDef : WellEventDefinition<any>) => {
    if (/*internalOp.source === eventDef.source &&*/ internalOp.kind === OpKind.EVENT && internalOp.result.status === "applied") {
      if (internalOp.parameters !== undefined) {
        const packedEvent = (internalOp.parameters.value as MichelsonV1ExpressionBase).bytes
        if (packedEvent !== undefined) {
          const event = createEvent(packedEvent, eventDef.filter);
          if (event !== undefined) {
            apps.push({ process : eventDef.process, event : event._event, data  : { ...data, source : eventDef.source, evtype : event._kind } })
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
      let data : Omit<WellEventData, 'source' | 'evtype'> = { block : block.hash, op : op.hash, time : block.header.timestamp.toString() }
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
    dump("processing block " + current.hash + " ...")
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
  dump("Starting tezos event listener ...")
  _running = true
  _stop = false
  bottom = running_bottom ?? bottom
  if (options !== undefined) {
    delay   = options.delay   ?? delay
    horizon = options.horizon ?? horizon
    bottom  = options.bottom  ?? bottom
    verbose = options.verbose ?? verbose
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
  dump("Tezos event listener stopped.")
}

export function stopCrank() {
  _stop = true
}