const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const umdPath = path.resolve(__dirname, "../dist/main.umd.js");
if (!fs.existsSync(umdPath)) {
  console.error("dist/main.umd.js not found, run `npm run build` first");
  process.exit(2);
}

const umdCode = fs.readFileSync(umdPath, "utf8");

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  runScripts: "dangerously",
  resources: "usable",
});

// Evaluate the UMD bundle in the JSDOM window context by injecting a script element
// (Do not provide convjpModule; test the self-contained UMD directly)
try {
  const scriptEl = dom.window.document.createElement("script");
  scriptEl.textContent = umdCode;
  dom.window.document.body.appendChild(scriptEl);
} catch (e) {
  console.error(
    "Failed to evaluate UMD bundle in JSDOM via script injection:",
    e,
  );
  process.exit(1);
}

const convjp = dom.window.convjp;
if (!convjp) {
  console.error("convjp global not found in JSDOM window");
  process.exit(1);
}

console.log("convjp global type:", typeof convjp);
console.log("convjp keys:", Object.keys(convjp));
console.log(
  "convjp has default:",
  Object.prototype.hasOwnProperty.call(convjp, "default"),
);
if (convjp.default) {
  console.log("convjp.default typeof:", typeof convjp.default);
  try {
    console.log(
      "convjp.default ownNames:",
      Object.getOwnPropertyNames(convjp.default).slice(0, 50),
    );
  } catch (err) {
    console.error("convjp.default ownNames error", (err && err.stack) || err);
  }
  try {
    console.log(
      "convjp.default symbols:",
      Object.getOwnPropertySymbols(convjp.default).map(String),
    );
  } catch (err) {
    console.error("convjp.default symbols error", (err && err.stack) || err);
  }
  try {
    console.log("convjp.default isFrozen:", Object.isFrozen(convjp.default));
  } catch (err) {
    console.error("convjp.default isFrozen error", (err && err.stack) || err);
  }
}

// Try to locate encode/decode either on convjp or convjp.default
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

if (!encodeFn || !decodeFn) {
  console.error("encode/decode not found on convjp or convjp.default");
  process.exit(1);
}

const input = "もぺもぺ";
const encoded = encodeFn(input);
const decoded = decodeFn(encoded);
const decoded2 = decodeFn(String(encoded));

console.log("input:", input);
console.log("encoded:", encoded);
console.log("decoded:", decoded);

// New contract: encode returns a plain garbled string and decode should roundtrip back to the original
if (
  typeof encoded === "string" &&
  typeof decoded === "string" &&
  decoded === input
) {
  console.log("UMD smoke test passed ✅ (roundtrip succeeded)");
  process.exit(0);
} else {
  console.error("UMD smoke test failed ❌ - decoded !== input");
  process.exit(1);
}
