import * as iconv from "./iconv-shiftjis.js";

// encode: take the UTF-8 bytes of the input string and decode them AS Shift_JIS,
// returning the resulting JavaScript string (a typical "mojibake" transform).
export function encode(s) {
  const utf8Bytes = new TextEncoder().encode(String(s));
  return iconv.decode(utf8Bytes);
}

// decode: take a garbled string, re-encode it as Shift_JIS bytes, then read those
// bytes back as UTF-8 — the inverse of encode(), recovering the original text.
export function decode(bytes) {
  if (bytes == null) return "";
  if (bytes && typeof bytes === "object" && bytes.rawBase64) {
    throw new Error("rawBase64 is not supported by this API");
  }

  const garbled =
    bytes && typeof bytes === "object" && bytes.encoded
      ? String(bytes.encoded)
      : String(bytes);

  const sjisBytes = iconv.encode(garbled);
  return new TextDecoder("utf-8").decode(sjisBytes);
}

// Keep global helper for script-tag consumers
if (typeof window !== "undefined" && !window.convjpModule) {
  Object.defineProperty(window, "convjpModule", {
    configurable: true,
    enumerable: true,
    value: { encode, decode },
  });
}
