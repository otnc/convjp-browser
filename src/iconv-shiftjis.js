// A minimal, Shift_JIS-only reimplementation of iconv-lite's public encode/decode.
//
// iconv-lite's public entry point (`iconv-lite/lib/index.js` + `encodings/index.js`)
// registers every supported encoding at once - Big5, GBK, EUC-KR, EUC-JP, UTF-7/16/32,
// all single-byte codepages - which pulls ~250KB of tables into the bundle for a library
// that only ever converts Shift_JIS. This instantiates just the `_dbcs` codec (from
// `encodings/dbcs-codec.js`) directly against the Shift_JIS mapping table, using the same
// codec options `encodings/dbcs-data.js` uses for its own `shiftjis` entry, and skips
// iconv-lite's `iconv.encodings` registry/lookup machinery entirely.
//
// This relies on iconv-lite's internal module layout, so a major/minor bump to iconv-lite
// that reshapes `encodings/dbcs-codec.js` or the `tables/shiftjis.json` format could break
// this - the round-trip test in test/umd.test.js guards against that.
import * as dbcs from "iconv-lite/encodings/dbcs-codec.js";
import shiftjisTable from "iconv-lite/encodings/tables/shiftjis.json";

const codecOptions = {
  encodingName: "shiftjis",
  table: () => shiftjisTable,
  encodeAdd: { "¥": 0x5c, "‾": 0x7e },
  encodeSkipVals: [{ from: 0xed40, to: 0xf940 }],
};

// Matches the defaults iconv-lite/lib/index.js sets at module scope.
const iconvDefaults = {
  defaultCharUnicode: "�",
  defaultCharSingleByte: "?",
};

const codec = new dbcs._dbcs(codecOptions, iconvDefaults);

export function encode(str) {
  const encoder = new codec.encoder({}, codec);
  const res = encoder.write(String(str));
  const trail = encoder.end();
  return trail && trail.length > 0 ? Buffer.concat([res, trail]) : res;
}

export function decode(bytes) {
  const decoder = new codec.decoder({}, codec);
  const res = decoder.write(bytes);
  const trail = decoder.end();
  return trail ? res + trail : res;
}
