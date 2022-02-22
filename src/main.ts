import { RpcClient } from '@taquito/rpc';
import { MyEvent, create_MyEvent } from "./bindings";
import { processBlock, register, run } from "./indexer";
import { sleep } from './utils';

function handle(e : MyEvent) {
  console.log(e.ival);
  console.log(e.sval);
}

const emitter = "KT1PPV3GpPU4ofRkSnzC7tzazCvjy3NhigA7"

register(emitter, create_MyEvent,  handle)

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
