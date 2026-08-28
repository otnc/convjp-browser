// jsdom doesn't expose TextEncoder/TextDecoder to the window/VM context it evaluates
// injected <script> content in, even though every real browser and Node itself provide
// them globally. Polyfill from Node's util module for tests only.
const { TextEncoder, TextDecoder } = require("util");

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}
