import { BlockResponse, InternalOperationResult, OperationContentsAndResultTransaction, OpKind, RpcClient } from '@taquito/rpc';

import { EventListenerOptions, UnpackedEvent, Event, EventData, EventDefinition, EventFilter, EventProcessor } from './types';
import { defaultIndexerOptions, sleep, to_taquito_object } from './utils';

let delay = defaultIndexerOptions.delay
let horizon = defaultIndexerOptions.horizon
let bottom = defaultIndexerOptions.bottom
let client = new RpcClient(defaultIndexerOptions.endpoint);
let verbose = defaultIndexerOptions.verbose

const eventDefinitions: Array<EventDefinition<any>> = []
const eventDefinitionSet: Set<string> = new Set()

const dump = (s: string) => {
  if (verbose) {
    console.log(s)
  }
}

const createEvent = (eventDef: EventDefinition<any>, internalOp: InternalOperationResult): UnpackedEvent | undefined => {
  if (internalOp.type !== undefined && internalOp.payload !== undefined && internalOp.tag !== undefined) {
    if (eventDef.filter(internalOp.tag)) {
      const data = to_taquito_object(internalOp.type, internalOp.payload);
      return { _kind: internalOp.tag, _event: data };
    }
  } else {
    // throw new Error('Error: Malformed event')
  }
  return undefined;
}

/**
 *
 * @param s source, address of the event emitter contract
 * @param c creator, event creator function (provided by binding generator)
 * @param p processor, your event processor
 * @description Registers an event definition in indexer
 *
 */
export function registerEvent<T extends Event>(
  { source, filter, process }: { source: string; filter: EventFilter, process: EventProcessor<T>; }): void {
  const key = source + filter.toString() + process.toString()
  if (eventDefinitionSet.has(key)) {
    return
  }
  eventDefinitions.push({ source: source, filter: filter, process: process })
  eventDefinitionSet.add(key)
}

type ApplyProcessor<T extends Event> = {
  process: EventProcessor<T>
  event: T
  data: EventData
}

/**
 *
 * @param internalOp block response to process.
 * @description Executes event processors on internal operation
 *
 */
function processInternalOp(internalOp: InternalOperationResult, data: Omit<EventData, 'source' | 'evtype'>): Array<ApplyProcessor<any>> {
  let apps: Array<ApplyProcessor<any>> = []
  eventDefinitions.forEach((eventDef: EventDefinition<any>) => {
    if (internalOp.source === eventDef.source && internalOp.kind === OpKind.EVENT && internalOp.result.status === "applied") {
      const event = createEvent(eventDef, internalOp);
      if (event !== undefined) {
        apps.push({ process: eventDef.process, event: event._event, data: { ...data, source: eventDef.source, evtype: event._kind } })
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
export function processBlock(block: BlockResponse): Array<ApplyProcessor<any>> {
  let apps: Array<ApplyProcessor<any>> = []
  block.operations.forEach(opentry => {
    opentry.forEach(op => {
      let data: Omit<EventData, 'source' | 'evtype'> = { block: block.hash, op: op.hash, time: block.header.timestamp.toString() }
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
async function crawl(bottom: BlockResponse): Promise<string> {
  let current: BlockResponse = await client.getBlock({ block: `head~${horizon}` })
  let nextBottom = current.hash
  let nbProcessed = 0
  let apps: Array<ApplyProcessor<any>> = []
  while (bottom.hash !== current.hash && nbProcessed++ < MAX_PROCESSED) {
    dump("processing block " + current.hash + " ...")
    let blockApps = processBlock(current)
    apps = blockApps.concat(apps)
    current = await client.getBlock({ block: current.header.predecessor })
  }
  apps.forEach(app => {
    app.process(app.event, app.data)
  })
  return nextBottom
}

let _stop = false
let _running = false

let running_bottom: string | undefined = undefined

/**
 *
 * @param options indexer options
 * @description Starts the event indexer
 *
 */
export async function run_listener(options?: EventListenerOptions) {
  if (_running) {
    return
  }
  _running = true
  _stop = false
  if (options !== undefined) {
    delay = options.delay ?? delay
    horizon = options.horizon ?? horizon
    bottom = options.bottom ?? bottom
    verbose = options.verbose ?? verbose
    if (options.endpoint !== undefined) {
      client = new RpcClient(options.endpoint)
    }
  }
  bottom = running_bottom ?? bottom
  dump("Starting tezos event listener ...")
  let bottomBlock: BlockResponse = await client.getBlock({ block: bottom })
  do {
    let newBottom = await crawl(bottomBlock)
    running_bottom = newBottom
    await sleep(delay)
    bottomBlock = await client.getBlock({ block: newBottom })
  } while (!_stop)
  _running = false
  dump("Tezos event listener stopped.")
}

export function stop_listener() {
  _stop = true
}