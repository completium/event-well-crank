import { run } from "../src/indexer";
import { register_SwitchOff, register_SwitchOn, SwitchOff, SwitchOn } from './bulb_bindings_gen';

const bulb = "KT19EAMugKU416cbA9jL1XcukWArfpv4dLYu"

function handleSwitchOn(e : SwitchOn) {
  console.log("Bulb switched ON by " + e.from + " on " + e.time);
}

function handleSwitchOff(e : SwitchOff) {
  console.log("Bulb switched OFF by " + e.from + " on " + e.time);
}

//registerMyEvent("KT1PPV3GpPU4ofRkSnzC7tzazCvjy3NhigA7",  handle)
register_SwitchOn(bulb, handleSwitchOn)
register_SwitchOff(bulb, handleSwitchOff)

async function testRun () {
  await run();
}

testRun();






