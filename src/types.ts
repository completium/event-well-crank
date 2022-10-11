
export interface Event {}

export type EventFilter = (t : string) => boolean

export type EventProcessor<T extends Event> = (t : T, d ?: EventData) => void

export interface EventDefinition<T extends Event> {
  source  : string
  filter : EventFilter
  process : EventProcessor<T>
}
/**
 * @description indexer options to pass to the 'run' function
 */
export type EventListenerOptions = {
  delay    ?: number
  horizon  ?: number
  endpoint ?: string
  bottom   ?: string
  verbose  ?: boolean
}

export type EventData = {
  block  : string
  op     : string
  time   : string
  source : string
  evtype : string
}

export type UnpackedEvent = {
  _kind  : string;
  _event : any
}