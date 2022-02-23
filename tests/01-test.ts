import { RpcClient } from '@taquito/rpc';
import { MyEvent, registerMyEvent } from "./bindings";
import { processBlock, run } from "../src/indexer";
import { registerSwitchOff, registerSwitchOn, SwitchOff, SwitchOn } from './bulb_bindings';

//function handle(e : MyEvent) {
//  console.log(e.ival);
//  console.log(e.sval);
//}

const bulb = "KT19EAMugKU416cbA9jL1XcukWArfpv4dLYu"

function handleSwitchOn(e : SwitchOn) {
  console.log("Bulb switched ON by " + e.from + " on " + e.time)
}

function handleSwitchOff(e : SwitchOff) {
  console.log("Bulb switched OFF by " + e.from + " on " + e.time)
}

//registerMyEvent("KT1PPV3GpPU4ofRkSnzC7tzazCvjy3NhigA7",  handle)
registerSwitchOn(bulb, handleSwitchOn)
registerSwitchOff(bulb, handleSwitchOff)

async function testProcessBlock () {
  const client = new RpcClient('https://hangzhounet.smartpy.io')
  const hash = 'BLSXkegjZzjFQPkiu31ozuChkbu3u9wPHmzMvwtkgxoWvyVPL6e';
  const block = await client.getBlock({ block: hash });
  await processBlock(block)
}

async function testRun () {
  await run()
}

let _ = testRun()
