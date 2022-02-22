
export interface ShaftEvent {}

export type ShaftEventCreator<T extends ShaftEvent> = (b : string) => T | undefined

export type ShaftEventProcessor<T extends ShaftEvent> = (t : T) => void

export interface ShaftEventDefinition<T extends ShaftEvent> {
  source  : string
  create  : ShaftEventCreator<T>
  process : ShaftEventProcessor<T>
}
/**
 * @description indexer options to pass to the 'run' function
 */
export type IndexerOptions = {
  delay    ?: number
  horizon  ?: number
  endpoint ?: string
  shaft    ?: string
}