import { Schema } from "@taquito/michelson-encoder";
import { MichelsonV1Expression } from "@taquito/rpc";

import { EventListenerOptions } from "./types"

export const defaultIndexerOptions : Required<EventListenerOptions> = {
    delay    : 2000,
    horizon  : 3,
    endpoint : 'https://mainnet.api.tez.ie',
    bottom   : "head~4",
    verbose  : false
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function to_taquito_object(ty : MichelsonV1Expression, expr : MichelsonV1Expression) : any {
  const schema = new Schema(ty);
  return schema.Execute(expr);
}
