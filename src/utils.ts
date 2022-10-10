import { MichelsonData, MichelsonType } from "@taquito/michel-codec";
import { Parser } from "@taquito/michel-codec";
import { unpackData } from "@taquito/michel-codec";
import { Schema } from "@taquito/michelson-encoder";
import { MichelsonV1Expression } from "@taquito/rpc";

import { CrankOptions } from "./types"

export const defaultIndexerOptions : Required<CrankOptions> = {
    delay    : 2000,
    horizon  : 3,
    endpoint : 'https://mainnet.api.tez.ie',
    bottom   : "head~4",
    verbose  : false
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseHex(s: string): number[] {
  const res: number[] = [];
  for (let i = 0; i < s.length; i += 2) {
    const ss = s.slice(i, i + 2);
    const x = parseInt(ss, 16);
    if (Number.isNaN(x)) {
      throw new Error(`can't parse hex byte: ${ss}`);
    }
    res.push(x);
  }
  return res;
}

export function to_taquito_object(ty : MichelsonType, expr : MichelsonV1Expression) : any {
  const schema = new Schema(ty);
  return schema.Execute(expr);
}
