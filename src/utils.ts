import { MichelsonData, MichelsonType } from "@taquito/michel-codec";
import { Parser } from "@taquito/michel-codec";
import { unpackData } from "@taquito/michel-codec";
import { Schema } from "@taquito/michelson-encoder";

import { CrankOptions } from "./types"

export const defaultIndexerOptions : Required<CrankOptions> = {
    delay    : 2000,
    horizon  : 3,
    endpoint : 'https://mainnet.api.tez.ie',
    well     : 'KT1AHVF5m8XaWPQCGgfAsZ9eSJJZ7WVGV2hE',
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

export function hex_to_data(ty : MichelsonType, s : string) : any {
  const expr : MichelsonData = unpackData(parseHex(s), ty);
  const schema = new Schema(ty);
  return schema.Execute(expr);
}
