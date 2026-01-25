const fs = require("fs");
const path = require("path");

describe("UMD bundle", () => {
  beforeAll(() => {
    const umdPath = path.resolve(__dirname, "../dist/main.umd.js");
    if (!fs.existsSync(umdPath)) {
      throw new Error(
        "dist/main.umd.js not found. Run `npm run build` before running jest",
      );
    }
    const code = fs.readFileSync(umdPath, "utf8");

    // Provide explicit runtime fallbacks that some UMD shapes expect
    try {
      globalThis.Encoding = require("encoding-japanese");
    } catch (e) {
      /* ignore */
    }
    try {
      globalThis.iconvLite = require("iconv-lite");
    } catch (e) {
      /* ignore */
    }

    // Evaluate the bundle in the JSDOM environment
    const script = document.createElement("script");
    script.textContent = code;
    document.body.appendChild(script);
  });

  test("exports encode/decode and roundtrips", () => {
    const convjp = globalThis.convjp || global.convjp || window.convjp;
    expect(convjp).toBeDefined();

    const encodeFn =
      typeof convjp.encode === "function"
        ? convjp.encode
        : convjp.default && typeof convjp.default.encode === "function"
          ? convjp.default.encode
          : null;
    const decodeFn =
      typeof convjp.decode === "function"
        ? convjp.decode
        : convjp.default && typeof convjp.default.decode === "function"
          ? convjp.default.decode
          : null;

    expect(typeof encodeFn).toBe("function");
    expect(typeof decodeFn).toBe("function");

    const input = "もぺもぺ";
    const encoded = encodeFn(input);
    const decoded = decodeFn(encoded);

    // Local conversion via encoding-japanese to verify canonical behavior
    let localDecoded = null;
    try {
      const enc = require("encoding-japanese");
      const arr = enc.convert(encoded, { to: "SJIS", type: "array" });
      const u8 = new Uint8Array(arr);
      if (typeof TextDecoder !== "undefined")
        localDecoded = new TextDecoder("utf-8").decode(u8);
      else localDecoded = Buffer.from(u8).toString("utf8");
    } catch (e) {
      // ignore
    }

    expect(typeof encoded).toBe("string");
    if (decoded === input) {
      expect(decoded).toBe(input);
    } else if (localDecoded === input) {
      throw new Error(
        "UMD decode did not recover original, but local encoding-japanese conversion does — UMD runtime likely did not resolve the SJIS encoder fallback",
      );
    } else {
      console.error("Debug: encoded:", encoded);
      console.error("Debug: decoded:", decoded);
      console.error("Debug: localDecoded:", localDecoded);
      expect(decoded).toBe(input); // rethrow for test failure
    }
  });
});
