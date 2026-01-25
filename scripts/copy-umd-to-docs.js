#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const src = path.join(repoRoot, "dist", "main.umd.js");
const destDir = path.join(repoRoot, "docs");
const dest = path.join(destDir, "main.umd.js");

async function run() {
  try {
    await fs.promises.mkdir(destDir, { recursive: true });
    await fs.promises.copyFile(src, dest);
    console.log(`Copied ${src} → ${dest}`);
  } catch (err) {
    console.error("Failed to copy UMD to docs:", err && (err.stack || err));
    process.exitCode = 1;
  }
}

run();
