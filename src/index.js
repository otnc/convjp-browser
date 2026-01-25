import * as iconv from "iconv-lite";
import * as Encoding from "encoding-japanese";

// Prefer the statically imported iconv-lite so the bundler includes encodings
try {
} catch (e) {}
const _staticIconv =
  (typeof iconv !== "undefined" && (iconv.default || iconv)) || null;

// Helpers: normalize UTF-8 bytes, convert to Buffer when possible, and resolve encoders/decoders
function toUtf8Bytes(str) {
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(str, "utf8");
    } catch (e) {}
  }
  if (typeof TextEncoder !== "undefined") {
    try {
      return new TextEncoder().encode(str);
    } catch (e) {}
  }
  return null;
}

function toBufferIfPossible(b) {
  try {
    if (
      typeof Buffer !== "undefined" &&
      b &&
      !(b instanceof Buffer) &&
      (b instanceof Uint8Array || ArrayBuffer.isView(b))
    )
      return Buffer.from(b);
  } catch (e) {}
  return b;
}

function resolveIconv(decoderNeeded) {
  try {
    if (
      _staticIconv &&
      ((decoderNeeded && typeof _staticIconv.decode === "function") ||
        (!decoderNeeded && typeof _staticIconv.encode === "function"))
    )
      return _staticIconv;
  } catch (e) {}

  if (_staticIconv && typeof _staticIconv.__require === "function") {
    try {
      let real = null;
      try {
        real = _staticIconv.__require();
      } catch (e1) {}
      try {
        if (!real) real = _staticIconv.__require("iconv-lite");
      } catch (e2) {}
      if (
        real &&
        ((decoderNeeded && typeof real.decode === "function") ||
          (!decoderNeeded && typeof real.encode === "function"))
      )
        return real;
      if (
        real &&
        real.default &&
        ((decoderNeeded && typeof real.default.decode === "function") ||
          (!decoderNeeded && typeof real.default.encode === "function"))
      )
        return real.default;
    } catch (e) {}
  }

  try {
    if (typeof require === "function") {
      const r = require("iconv-lite");
      if (
        r &&
        ((decoderNeeded && typeof r.decode === "function") ||
          (!decoderNeeded && typeof r.encode === "function"))
      )
        return r;
      if (
        r &&
        r.default &&
        ((decoderNeeded && typeof r.default.decode === "function") ||
          (!decoderNeeded && typeof r.default.encode === "function"))
      )
        return r.default;
    }
  } catch (e) {}

  return null;
}

function resolveEncodingJapanese() {
  let enc = (typeof Encoding !== "undefined" && Encoding) || null;
  if (enc && enc.default && typeof enc.default.convert === "function")
    enc = enc.default;
  if (
    (!enc || typeof enc.convert !== "function") &&
    typeof require === "function"
  ) {
    try {
      const reqEnc = require("encoding-japanese");
      if (reqEnc && typeof reqEnc.convert === "function") enc = reqEnc;
      if (
        !enc &&
        reqEnc &&
        reqEnc.default &&
        typeof reqEnc.default.convert === "function"
      )
        enc = reqEnc.default;
    } catch (e) {}
  }
  if (
    (!enc || typeof enc.convert !== "function") &&
    Encoding &&
    typeof Encoding.__require === "function"
  ) {
    try {
      const eReal = Encoding.__require();
      if (eReal && typeof eReal.convert === "function") enc = eReal;
      if (
        !enc &&
        eReal &&
        eReal.default &&
        typeof eReal.default.convert === "function"
      )
        enc = eReal.default;
    } catch (e) {}
  }
  return enc && typeof enc.convert === "function" ? enc : null;
}

// encode: take the UTF-8 bytes of the input string and decode them AS Shift_JIS,
// returning the resulting JavaScript string (a typical "mojibake" transform).
export function encode(s) {
  const str = String(s);

  // Try iconv-style decoder first (static or require)
  try {
    const impl = resolveIconv(true);
    if (impl) {
      const utf8Buf = toUtf8Bytes(str);
      const b = toBufferIfPossible(utf8Buf);
      try {
        const garbled = impl.decode(b, "shift_jis");
        return garbled;
      } catch (e) {
        console.error(
          "DEBUG encode: static path threw",
          e && e.stack ? e.stack : e,
        );
      }
    }
  } catch (e) {}

  // Fallback using TextDecoder('shift_jis') if available
  try {
    if (
      typeof TextEncoder !== "undefined" &&
      typeof TextDecoder !== "undefined"
    ) {
      const bytes = new TextEncoder().encode(str);
      try {
        const garbled = new TextDecoder("shift_jis").decode(bytes);
        return garbled;
      } catch (e) {}
    }
  } catch (e) {}

  // Fallback using encoding-japanese
  try {
    const enc = resolveEncodingJapanese();
    if (enc) {
      const utf8Buf = toUtf8Bytes(str);
      const arr =
        utf8Buf && typeof utf8Buf.slice === "function"
          ? Array.prototype.slice.call(utf8Buf)
          : utf8Buf
            ? Array.from(utf8Buf)
            : [];
      const garbled = enc.convert(arr, {
        from: "SJIS",
        to: "UNICODE",
        type: "string",
      });
      return garbled;
    }
  } catch (e) {}

  return str;
}

export function decode(bytes) {
  if (bytes == null) return "";
  if (bytes && typeof bytes === "object") {
    if (bytes.rawBase64) {
      throw new Error("rawBase64 is not supported by this API");
    }
    if (bytes.encoded) {
      try {
        String(bytes.encoded);
      } catch (e) {}
    }
  }

  const garbled =
    bytes && typeof bytes === "object" && bytes.encoded
      ? String(bytes.encoded)
      : String(bytes);

  // Try iconv-style encoder
  try {
    const impl = resolveIconv(false);
    if (impl) {
      const sjisBuf = impl.encode(garbled, "shift_jis");
      if (typeof Buffer !== "undefined")
        return Buffer.from(sjisBuf).toString("utf8");
      if (typeof TextDecoder !== "undefined")
        return new TextDecoder("utf-8").decode(sjisBuf);
      try {
        return String(sjisBuf);
      } catch (e) {
        return "";
      }
    }
  } catch (e) {
    console.error("decode: iconvImpl.encode threw", e && e.stack ? e.stack : e);
  }

  // Fallback: encoding-japanese
  try {
    const enc = resolveEncodingJapanese();
    if (enc) {
      const arr = enc.convert(garbled, { to: "SJIS", type: "array" });
      const u8 = new Uint8Array(arr);
      if (typeof TextDecoder !== "undefined")
        return new TextDecoder("utf-8").decode(u8);
      if (typeof Buffer !== "undefined")
        return Buffer.from(u8).toString("utf8");
    }
  } catch (e) {
    console.error(
      "decode: encoding-japanese fallback threw",
      e && e.stack ? e.stack : e,
    );
  }

  try {
    return String(garbled);
  } catch (e) {
    return "";
  }
}

// Keep global helper for script-tag consumers
try {
  if (typeof window !== "undefined" && !window.convjpModule) {
    Object.defineProperty(window, "convjpModule", {
      configurable: true,
      enumerable: true,
      value: {
        encode: (s) => encode(s),
        decode: (s) => decode(s),
      },
    });
  }
} catch (e) {
  // ignore
}
