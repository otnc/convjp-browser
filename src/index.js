import * as iconv from "iconv-lite";
import * as Encoding from "encoding-japanese";

// Prefer the statically imported iconv-lite so the bundler includes encodings
try {
} catch (e) {}
const _staticIconv =
  (typeof iconv !== "undefined" && (iconv.default || iconv)) || null;
// encode: take the UTF-8 bytes of the input string and decode them AS Shift_JIS,
// returning the resulting JavaScript string (a typical "mojibake" transform).
export function encode(s) {
  const str = String(s);
  try {
  } catch (e) {}

  // Preferred static iconv path
  if (_staticIconv && typeof _staticIconv.decode === "function") {
    try {
      const utf8Buf =
        typeof Buffer !== "undefined"
          ? Buffer.from(str, "utf8")
          : typeof TextEncoder !== "undefined"
            ? new TextEncoder().encode(str)
            : null;
      let b = utf8Buf;
      try {
        if (
          typeof Buffer !== "undefined" &&
          b &&
          !(b instanceof Buffer) &&
          (b instanceof Uint8Array || ArrayBuffer.isView(b))
        )
          b = Buffer.from(b);
      } catch (e) {}
      const garbled = _staticIconv.decode(b, "shift_jis");

      // Return the garbled string only (raw bytes / base64 are no longer exposed)
      try {
        return garbled;
      } catch (e) {
        /* static encode path threw (suppressed) */
      }
    } catch (e) {
      console.error(
        "DEBUG encode: static path threw",
        e && e.stack ? e.stack : e,
      );
    }
  }

  // Runtime require fallback
  try {
    if (typeof require === "function") {
      const r = require("iconv-lite");
      if (r && typeof r.decode === "function") {
        try {
          const utf8Buf =
            typeof Buffer !== "undefined"
              ? Buffer.from(str, "utf8")
              : typeof TextEncoder !== "undefined"
                ? new TextEncoder().encode(str)
                : null;
          let b = utf8Buf;
          try {
            if (
              typeof Buffer !== "undefined" &&
              b &&
              !(b instanceof Buffer) &&
              (b instanceof Uint8Array || ArrayBuffer.isView(b))
            )
              b = Buffer.from(b);
          } catch (e) {}
          const garbled = r.decode(b, "shift_jis");
          return garbled;
        } catch (e) {
          return garbled;
        }
      }
    }
  } catch (e) {}

  // Fallback using TextDecoder('shift_jis') if available
  try {
    if (typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined') {
      const bytes = new TextEncoder().encode(str)
      try {
        const garbled = new TextDecoder('shift_jis').decode(bytes)
        try { return garbled } catch (e) { return garbled }
      } catch (e) {}
    }
  } catch (e) {}

  // Fallback using encoding-japanese: interpret the UTF-8 bytes as SJIS bytes and make a string
  try {
    let enc = (typeof Encoding !== 'undefined' && Encoding) || null
    if (enc && enc.default && typeof enc.default.convert === 'function') enc = enc.default
    if ((!enc || typeof enc.convert !== 'function') && typeof require === 'function') {
      try {
        const reqEnc = require('encoding-japanese')
        if (reqEnc && typeof reqEnc.convert === 'function') enc = reqEnc
        if (!enc && reqEnc && reqEnc.default && typeof reqEnc.default.convert === 'function') enc = reqEnc.default
      } catch (e) {}
    }
    if ((!enc || typeof enc.convert !== 'function') && Encoding && typeof Encoding.__require === 'function') {
      try {
        const eReal = Encoding.__require()
        if (eReal && typeof eReal.convert === 'function') enc = eReal
        if (!enc && eReal && eReal.default && typeof eReal.default.convert === 'function') enc = eReal.default
      } catch (e) {}
    }

    if (enc && typeof enc.convert === 'function') {
      const utf8Buf = (typeof Buffer !== 'undefined') ? Buffer.from(str, 'utf8') : (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(str) : null)
      const arr = (utf8Buf && typeof utf8Buf.slice === 'function') ? Array.prototype.slice.call(utf8Buf) : (utf8Buf ? Array.from(utf8Buf) : [])
      // Interpret these bytes as SJIS and convert to Unicode string
      const garbled = enc.convert(arr, { from: 'SJIS', to: 'UNICODE', type: 'string' })
      return garbled
    }
  } catch (e) {}

  // As a last resort, return the original string
  return str;
}

export function decode(bytes) {
  if (bytes == null) return "";
  // If the encoded value is an object with rawBase64, use it directly (structured-clone safe)
  if (bytes && typeof bytes === "object") {
    if (bytes.rawBase64) {
      // rawBase64 is explicitly unsupported by this API by design
      throw new Error("rawBase64 is not supported by this API");
    }
    if (bytes.encoded) {
      try {
        const g = String(bytes.encoded);
        if (g) {
          /* continue with garbled */
        }
      } catch (e) {}
    }
  }

  const garbled =
    bytes && typeof bytes === "object" && bytes.encoded
      ? String(bytes.encoded)
      : String(bytes);

  // DEBUG: log which branch we're about to take
  try {
  } catch (e) {}

  // Try to resolve an iconv implementation that can encode to Shift_JIS
  let iconvImpl = null;
  try {
    if (_staticIconv && typeof _staticIconv.encode === "function") {
      iconvImpl = _staticIconv;
    }
  } catch (e) {}

  // If static iconv didn't expose encode, try to reach its internal implementation
  if (
    !iconvImpl &&
    _staticIconv &&
    typeof _staticIconv.__require === "function"
  ) {
    try {
      let real = null;
      try {
        real = _staticIconv.__require();
      } catch (e1) {
        /* ignore */
      }
      try {
        if (!real) real = _staticIconv.__require("iconv-lite");
      } catch (e2) {
        /* ignore */
      }
      if (real && typeof real.encode === "function") iconvImpl = real;
      if (
        !iconvImpl &&
        real &&
        real.default &&
        typeof real.default.encode === "function"
      )
        iconvImpl = real.default;
    } catch (e) {
      console.error("decode: __require() failed", e && e.stack ? e.stack : e);
    }
  }

  // Try Node-style require as a last resort (may not be available in browser UMD runtime)
  if (!iconvImpl && typeof require === "function") {
    try {
      const r = require("iconv-lite");
      if (r && typeof r.encode === "function") iconvImpl = r;
      if (
        !iconvImpl &&
        r &&
        r.default &&
        typeof r.default.encode === "function"
      )
        iconvImpl = r.default;
    } catch (e) {
      // ignore
    }
  }

  if (iconvImpl) {
    try {
      const sjisBuf = iconvImpl.encode(garbled, "shift_jis");

      if (typeof Buffer !== "undefined")
        return Buffer.from(sjisBuf).toString("utf8");
      if (typeof TextDecoder !== "undefined")
        return new TextDecoder("utf-8").decode(sjisBuf);
      try {
        return String(sjisBuf);
      } catch (e) {
        return "";
      }
    } catch (e) {
      console.error(
        "decode: iconvImpl.encode threw",
        e && e.stack ? e.stack : e,
      );
    }
  }

  // Fallback: try encoding-japanese in several shapes (default export or direct)
  try {
    let enc = (typeof Encoding !== "undefined" && Encoding) || null;
    if (enc && enc.default && typeof enc.default.convert === "function")
      enc = enc.default;
    // Try Node-style require
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

    // Try the bundler-provided __require() if present (some UMD shapes wrap internals)
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
      } catch (e) {
        console.error(
          "decode: Encoding.__require() failed",
          e && e.stack ? e.stack : e,
        );
      }
    }

    if (enc && typeof enc.convert === "function") {
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

  // Fallback: best-effort - return provided string as-is
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
