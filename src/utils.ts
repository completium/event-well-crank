import { IndexerOptions } from "./types"

export const defaultIndexerOptions : Required<IndexerOptions> = {
    delay    : 2000,
    horizon  : 3,
    endpoint : 'https://hangzhounet.smartpy.io',
    shaft    : 'KT1UsVVireDXZE5R1waCeyKnYD178g2cVDji',
    bottom   : "head~4"
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseHex(s: string): number[] {
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