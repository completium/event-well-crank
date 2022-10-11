# Event Listener

`@completium/event-listener` detects events emitted by smart contracts on the [Tezos](https://tezos.com/) blockchain, and executes registered event handler functions.

## API

### `register`

Registers an event handler for a specific contract. It takes 3 arguments:
* the address of the emitter contract
* the function to create an event from its packed version
* the *event handler* function that takes 2 arguments:
  * the emitted event
  * the event data (optional)

The function to create the event may be automatically generated (see [Bindings](#bindings) below).

The event data provides information about the emitted event:
* date
* block hash
* operation hash
* source of the event (account address at the source of the event emission)

### `startEventListener`

Starts the listener process. It takes an optional `EventListenerOptions` object with optional fields:

| Field | Type | Default | Desc |
| -- | -- | -- | -- |
| `bottom` | `string` | `head~4` | block hash to start crawling from |
| `delay` | `number` | `2000` | number of milliseconds between two lookups of the event well contract |
| `horizon` | `number` | `3` | number of blocks to look back (the higher, the higher the probability to read the main branch) |
| `endpoint` | `string` | `https://mainnet.api.tez.ie` | endpoint used by the event crank |
| `verbose` | `boolean` | `false` | flag to turn crank's verbose mode on/off |

### `stopEventListener`

Stops the event listener.

## Bindings

[`@completium/completium-cli`](https://www.npmjs.com/package/@completium/completium-cli) generates the TS bindings from an [Archetype](https://archetype-lang.org) contract. It generates for each event emitted by a contract:
* the event type
* the `register` event function

The completium CLI command to generate the bindings:

```bash
$ completium-cli generate bindings-ts mycontract.arl > mycontract-bindings.ts
```

## Example

This example illustrates how to emit event from a smart contract and how to receive them in a Dapp.

### Emit event

Declare the event type with the `event` declaration and emit an event with the `emit` instruction:

```typescript
archetype event_demo

event TestEvent {
  val: string
}

entry emit_event(v : string) {
  if length(v) > 20 then
    emit<TestEvent>({ val })
}
```

Deploy the contract on the testnet with the following command:
```bash
$ completium-cli set endpoint https://ithacanet.ecadinfra.com
$ completium-cli deploy event_demo.arl
```

### Receive event

Generate bindings with the following command:
```bash
$ completium-cli generate bindings-ts event_demo > bindings-event_demo.ts
```

It generates the following two elements:
* `EventDemo`
* `register_TestEvent`

These elements may be used to implement the event receiver application which registers an event handler and starts the cranks. Say the event demo contract deployed above is at address `KT19EAMugKU416cbA9jL1XcukWArfpv4dLYA`
```typescript
import { runCrank } from '@completium/event-listener';
import { register_TestEvent, TestEvent } from './bindings-event_demo';

const handleTestEvent = (e : TestEvent) => {
  console.log(`Test Event received with value "${e.val}"!`);
}

const run = async () => {
  register_TestEvent('KT19EAMugKU416cbA9jL1XcukWArfpv4dLYA', handleTestEvent);
  runEventListener({
    endpoint: 'https://ithacanet.ecadinfra.com',
  })
}

await run()
```

### Execute

Compile and run the application above. Then call the contract with the following command:

```bash
$ completium-cli call event_demo --arg `{ "v" : "This is a long enough string." }`
```

After a few blocks generation, the application prints the following message:

```
Test Event received with value "This is a long enough string."!
```
