
export interface WellEvent {}

export type WellEventCreator<T extends WellEvent> = (b : string) => T | undefined

export type WellEventProcessor<T extends WellEvent> = (t : T, d ?: WellEventData) => void

export interface WellEventDefinition<T extends WellEvent> {
  source  : string
  create  : WellEventCreator<T>
  process : WellEventProcessor<T>
}
/**
 * @description indexer options to pass to the 'run' function
 */
export type CrankOptions = {
  delay    ?: number
  horizon  ?: number
  endpoint ?: string
  well     ?: string
  bottom   ?: string
  verbose  ?: boolean
}

export type WellEventData = {
  block  : string
  op     : string
  time   : string
  source : string
}