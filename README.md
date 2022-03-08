# Event well Crank

`@completium/event-well-crank` receives events from smart contracts on the [Tezos](https://tezos.com/) blockchain. It executes registered event handler functions when receiving the event.

## API

### `register`

Registers an event handler for a specific contract. It takes 3 arguments:
* the address of the emitter contract
* the function to create an event from its packed version
* the event handler function

The function to create the event may be automatically generated (see [Bindings](#bindings) below).

The handler function takes 2 arguments:
* the emitted event
* the event data (optional)

The event data provides information about the emitted event:
* date
* block hash
* operation hash
* source of the event (account address at the source of the event emission)

### `startCrank`

Starts the crank process. It takes an optional `CrankOptions` object with optional fields:

| Field | Type | Default | Desc |
| -- | -- | -- | -- |
| `delay` | `number` | `2000` | number of milliseconds between two lookups of the event well contract |
| `horizon` | `number` | `3` | number of blocks to look back (the higher, the higher the probability to read the main branch) |
| `endpoint` | `string` | `https://mainnet.api.tez.ie` | endpoint used by the event crank |
| `well` | `string` | `KT1...` | address of the event well contract |
| `bottom` | `string` | `head~4` | block hash to start crawling from |


### `stopCrank`

Stops the crank.

## Bindings

[`@completium/completium-cli`](https://www.npmjs.com/package/@completium/completium-cli) generates the bindings for an [Archetype](https://archetype-lang.org) contract. It generates for each event emitted by a contract:
* the event type
* the `make` event function
* the dedicated register function (calls [`register`](#register) function with generated `make` function), which takes 2 arguments:
  * the address of the emitter contract
  * the event handler function

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
  if length(v) > 4 then
    emit<TestEvent>({ val })
}
```

Deploy the contract on the test net with the following command:
```bash
$ completium-cli set endpoint https://hangzhounet.api.tez.ie
$ completium-cli deploy event_demo.arl
```

### Receive event

Generate bindings with the following command:
```bash
$ completium-cli generate bindings-ts event_demo > bindings-event_demo.ts
```

It generates the following two elements:
* `EventDemo`
* `register_EventDemo`

These elements may be used to implement the event receiver application which registers an event handler and starts the cranks. Say the event demo contract deployed above is at address `KT19EAMugKU416cbA9jL1XcukWArfpv4dLYA`
```typescript
import { runCrank } from '@completium/event-well-crank';
import { register_TestEvent, TestEvent } from './test_bindings_gen';

const handleTestEvent = (e : TestEvent) => {
  console.log(`Test Event received with value "${e.val}"!`);
}

const run = async () => {
  register_TestEvent('KT19EAMugKU416cbA9jL1XcukWArfpv4dLYA', handleTestEvent);
  runCrank()
}

run()
```

> use

### Execute

Compile and run the application above. Then call the contract with the following command:

```bash
$ completium-cli call event_demo --arg `{ "v" : "This is a long enough string." }`
```

After a few blocks generation, the application prints the follwing message:

```
Test Event received with value "This is a long enough string."!
```