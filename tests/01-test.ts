import { runCrank } from '../src';
import { register_TestEvent, TestEvent } from './test_bindings_gen';
import { InMemorySigner, importKey } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { BlockResponse, RpcClient } from '@taquito/rpc';
import fs from 'fs';

const Tezos = new TezosToolkit('https://hangzhounet.api.tez.ie');

Tezos.setProvider({
  signer: new InMemorySigner('YOUR_PRIVATE_KEY'),
});

let client  = new RpcClient('https://hangzhounet.api.tez.ie');

const event_test_michelson = fs.readFileSync('./contracts/testevent.tz').toString();

const anint = 12345
const astring = 'This is a string test'

function handleTestEvent(e : TestEvent) {
  console.log(`Test Event detected with values ${e.ival} and ${e.sval}!`);
  if (e.ival.toNumber() !== anint || e.sval !== astring) {
    process.exit(-1)
  }
  process.exit()
}

const runTest = async () => {
  const originationOp = await Tezos.contract.originate({
    code: event_test_michelson,
    storage: {}
  });
  console.log(`Waiting for confirmation of origination for ${originationOp.contractAddress}...`);
  const contract = await originationOp.contract();
  console.log(`Origination completed.`);
  console.log(`Contract originated at ${contract.address}.`);
  register_TestEvent(contract.address, handleTestEvent);
  let bottomBlock : BlockResponse = await client.getBlock({ block: "head" });
  let bottom = bottomBlock.hash;
  console.log(`Bottom block hash is ${bottom}`);
  const op = await contract.methods.default(anint, astring).send();
  console.log("Calling contract ...");
  await op.confirmation();
  console.log("Running Crank ...");
  runCrank({ bottom : bottom });
}

runTest()