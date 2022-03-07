import { runCrank } from '../src';
import { register_TestEvent, TestEvent } from './test_bindings_gen';

import { importKey } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

const Tezos = new TezosToolkit('https://hangzhounet.api.tez.ie');
importKey(Tezos, "p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1")

const bulb = "KT19EAMugKU416cbA9jL1XcukWArfpv4dLYu"

function handleTestEvent(e : TestEvent) {
  console.log("Test Event detected: " + e.ival + " on " + e.sval);
}

//registerMyEvent("KT1PPV3GpPU4ofRkSnzC7tzazCvjy3NhigA7",  handle)
register_TestEvent(bulb, handleTestEvent)

async function testRun () {
  await runCrank();
}



testRun();






