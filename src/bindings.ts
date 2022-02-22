import { unpackData, MichelsonType, Parser, Prim, IntLiteral, StringLiteral } from '@taquito/michel-codec';
import { ShaftEventCreator, ShaftEvent } from "./types"
import { parseHex } from './utils';

export interface MyEvent extends ShaftEvent {
    ival : number
    sval : string
}

export const create_MyEvent : ShaftEventCreator<MyEvent> = (s : string) => {
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
    ival : parseInt(args[0].int, 10),
    sval : args[1].string
  }
}
