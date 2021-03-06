/* Bindings typescript generated by archetype version: 1.2.14 */

import { registerEvent, WellEvent, WellEventProcessor, WellEventData } from '../src';
import BigNumber from 'bignumber.js';

/* Event: TestEvent */

export interface TestEvent extends WellEvent {
  ival : BigNumber,
  sval : string
}

const is_TestEvent = (t : string) => {
  return t === 'TestEvent'
}

const handle_TestEvent = (handler : WellEventProcessor<TestEvent>) => (event : any, data ?: WellEventData) => {
  handler({ival : event.ival,
           sval : event.sval}, data)
}

export function register_TestEvent(source : string, handler : WellEventProcessor<TestEvent>) {
  registerEvent({ source: source, filter: is_TestEvent, process: handle_TestEvent(handler) })
}
