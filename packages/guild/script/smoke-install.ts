#!/usr/bin/env bun
// script/smoke-install.ts — Plugin installability smoke test for @runecraft/guild
//
// Simulates the OpenCode plugin loading flow in a clean isolated environment:
// 1. Creates a temp directory with a minimal opencode.json
// 2. Packs the current guild package as a tarball
// 3. Installs the tarball in the clean environment
// 4. Dynamically imports the plugin and checks the export contract
// 5. Calls the plugin factory with a minimal mock context
//
// Exits with 0 on success, 1 on failure.

import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"

const TMP_ROOT = `/tmp/guild-smoke-${Date.now()}`
const PACKAGE_DIR = process.cwd()

function log(ok: boolean, msg: string) {
  console.log(`${ok ? "✓" : "✗"} ${msg}`)
}

function fail(msg: string): never {
  console.log(`✗ ${msg}`)
  process.exit(1)
}

// 1. Create clean temp environment
mkdirSync(TMP_ROOT, { recursive: true })

// 2. Pack the guild package using npm pack (bun pack not available in bun 1.3)
const packResult = Bun.spawnSync(["npm", "pack", "--pack-destination", TMP_ROOT], {
  cwd: PACKAGE_DIR,
})
if (packResult.exitCode !== 0) {
  rmSync(TMP_ROOT, { recursive: true })
  fail(`npm pack failed: ${new TextDecoder().decode(packResult.stderr)}`)
}
// Find the tarball filename
const packOutput = new TextDecoder().decode(packResult.stdout)
const lines = packOutput.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("npm "))
const tarballName = lines.pop() || "runecraft-guild-0.0.0.tgz"
const tarballPath = join(TMP_ROOT, tarballName)
log(true, `packed guild artifact (${tarballName})`)

// 3. Create fixture project
const fixtureDir = join(TMP_ROOT, "fixture")
mkdirSync(fixtureDir, { recursive: true })

writeFileSync(
  join(fixtureDir, "package.json"),
  JSON.stringify({ name: "guild-smoke-fixture", private: true, type: "module" })
)

writeFileSync(
  join(fixtureDir, "opencode.json"),
  JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    plugin: ["@runecraft/guild"],
  })
)

// 4. Install the packed tarball
const installResult = Bun.spawnSync(
  ["bun", "add", tarballPath, "--no-cache"],
  { cwd: fixtureDir }
)
if (installResult.exitCode !== 0) {
  rmSync(TMP_ROOT, { recursive: true })
  fail(`installation failed in clean environment`)
}
log(true, "installed in clean environment")

// 5. Verify the installed module resolves correctly
const modPath = join(fixtureDir, "node_modules", "@runecraft", "guild")
if (!existsSync(modPath)) {
  rmSync(TMP_ROOT, { recursive: true })
  fail(`@runecraft/guild not found in installed node_modules`)
}
log(true, "module resolves in node_modules")

// 6. Dynamic import and contract validation
const mod = await import(join(modPath, "dist", "index.js"))

const hasDefault = typeof mod.default === "function"
if (!hasDefault) fail("default export is not a function")
log(true, "default export is a function")

const hasServer = typeof mod.server === "function"
if (!hasServer) fail("named export 'server' is not a function")
log(true, "server export is a function")

const sameRef = mod.default === mod.server
if (!sameRef) fail("default and server exports point to different functions")
log(true, "default and server export reference the same function")

// 6b. CJS require compatibility — verify require() resolves via exports field
const modDir = join(fixtureDir, "node_modules", "@runecraft", "guild")
const pkgJson = JSON.parse(await Bun.file(join(modDir, "package.json")).text())
const hasRequireExport = pkgJson.exports?.["."]?.require === "./dist/index.js"
if (!hasRequireExport) fail("package.json exports field missing 'require' condition")
log(true, "package.json exports has require condition")

// 6c. Smoke-test CJS require resolves from installed artifact
const cjsMod = require(join(modDir, "dist", "index.js"))
if (typeof cjsMod.default !== "function") fail("CJS require() — default export is not a function")
log(true, "CJS require() resolves default export as a function")

// 7. Smoke-test the plugin factory with a minimal mock context
try {
  const result = await mod.default({
    client: {},
    project: fixtureDir,
    directory: fixtureDir,
    worktree: fixtureDir,
    serverUrl: "http://localhost:3000",
  })
  const isHooks = typeof result === "object" && result !== null
  if (!isHooks) fail("plugin factory did not return a Hooks object")
  log(true, "plugin factory returns a Hooks object")
} catch (err) {
  fail(`plugin factory threw: ${err}`)
}

// 8. Cleanup
rmSync(TMP_ROOT, { recursive: true })
console.log("\nALL SMOKE CHECKS PASSED ✓")
process.exit(0)
