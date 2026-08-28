const fs = require("fs");
const path = require("path");

describe("UMD bundle", () => {
  let convjp;

  beforeAll(() => {
    const umdPath = path.resolve(__dirname, "../dist/main.umd.js");
    if (!fs.existsSync(umdPath)) {
      throw new Error(
        "dist/main.umd.js not found. Run `npm run build` before running jest",
      );
    }
    const code = fs.readFileSync(umdPath, "utf8");

    // Evaluate the bundle in the JSDOM environment, as a self-contained <script> tag
    // would be in a real browser — no Node globals (require, Buffer) are provided.
    const script = document.createElement("script");
    script.textContent = code;
    document.body.appendChild(script);

    convjp = globalThis.convjp || global.convjp || window.convjp;
  });

  test("exports encode/decode functions", () => {
    expect(convjp).toBeDefined();
    expect(typeof convjp.encode).toBe("function");
    expect(typeof convjp.decode).toBe("function");
  });

  test.each([
    ["もぺもぺ", "hiragana"],
    ["¥100", "yen sign (Shift_JIS-specific mapping)"],
    ["a‾b", "overline (Shift_JIS-specific mapping)"],
    ["Hello, World!", "ASCII"],
    ["", "empty string"],
  ])("round-trips %j (%s)", (input) => {
    const encoded = convjp.encode(input);
    expect(typeof encoded).toBe("string");
    const decoded = convjp.decode(encoded);
    expect(decoded).toBe(input);
  });
});
