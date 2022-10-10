
export interface WellEvent {}

export type WellEventFilter = (t : string) => boolean

export type WellEventProcessor<T extends WellEvent> = (t : T, d ?: WellEventData) => void

export interface WellEventDefinition<T extends WellEvent> {
  source  : string
  filter : WellEventFilter
  process : WellEventProcessor<T>
}
/**
 * @description indexer options to pass to the 'run' function
 */
export type CrankOptions = {
  delay    ?: number
  horizon  ?: number
  endpoint ?: string
  bottom   ?: string
  verbose  ?: boolean
}

export type WellEventData = {
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