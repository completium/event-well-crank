import { unpackData, MichelsonType, Parser, Prim, IntLiteral, StringLiteral } from '@taquito/michel-codec';
import { registerEvent } from '../src/indexer';
import { ShaftEvent, ShaftEventProcessor } from "../src/types"
import { parseHex } from '../src/utils';

export interface MyEvent extends ShaftEvent {
  ival : number
  sval : string
}

export function registerMyEvent(source : string, handler : ShaftEventProcessor<MyEvent>) {
  registerEvent({ s: source, c: (s : string) => {
    const t : MichelsonType = {
      "prim": "pair",
      "args": [
          {
              "prim": "int"
          },
          {
              "prim": "string"
          }
      ]
    };
    const expr = (new Parser).parseJSON(unpackData(parseHex(s), t));
    let args = (expr as Prim<'Pair',[IntLiteral<string>, StringLiteral]>).args
    if (args === undefined) {
      return undefined
    }
    return {
      kind : 'MyEvent',
      ival : parseInt(args[0].int, 10),
      sval : args[1].string
    }
  }
  , p: handler })
}