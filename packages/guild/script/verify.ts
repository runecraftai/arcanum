#!/usr/bin/env bun
// script/verify.ts — End-to-end verification for @runecraft/guild

import { existsSync, copyFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"

interface CheckResult {
  name: string
  passed: boolean
  output?: string
}

function runCheck(name: string, cmd: string[]): CheckResult {
  const result = Bun.spawnSync(cmd, { cwd: process.cwd() })
  const passed = result.exitCode === 0
  const output =
    new TextDecoder().decode(result.stdout) +
    new TextDecoder().decode(result.stderr)
  return { name, passed, output: output.trim() }
}

function runCheckWithCwd(name: string, cmd: string[], cwd: string): CheckResult {
  const result = Bun.spawnSync(cmd, { cwd })
  const passed = result.exitCode === 0
  const output =
    new TextDecoder().decode(result.stdout) +
    new TextDecoder().decode(result.stderr)
  return { name, passed, output: output.trim() }
}

const checks: CheckResult[] = []

// 1. generated config schema freshness
checks.push(runCheck("schema:config:check", ["bun", "run", "schema:config:check"]))

// 2. typecheck
checks.push(runCheck("typecheck", ["bun", "run", "typecheck"]))

// 3. test
const testResult = runCheck("test", ["bun", "test"])
const testOutput = testResult.output ?? ""
const testCountMatch = testOutput.match(/(\d+)\s+pass/)
const testCount = testCountMatch ? ` (${testCountMatch[1]} passed)` : ""
checks.push({ ...testResult, name: `test${testCount}` })

// 4. build
const buildResult = runCheck("build", ["bun", "run", "build"])
checks.push(buildResult)

// 5. plugin-export — depends on dist/index.js from build
checks.push(
  runCheck("plugin-export", [
    "bun",
    "-e",
    "import p from './dist/index.js'; process.exit(typeof p === 'function' ? 0 : 1)",
  ])
)

// 6. server-named-export — PluginModule compatibility
checks.push(
  runCheck("server-named-export", [
    "bun",
    "-e",
    "import * as m from './dist/index.js'; process.exit(typeof m.server === 'function' ? 0 : 1)",
  ])
)

// 7. no-function-exports — only default + server should be functions
checks.push(
  runCheck("no-function-exports", [
    "bun",
    "-e",
    "import * as m from './dist/index.js'; const fns = Object.entries(m).filter(([k,v]) => typeof v === 'function' && k !== 'default' && k !== 'server'); process.exit(fns.length === 0 ? 0 : 1)",
  ])
)

// 8. 8-agents
checks.push(
  runCheck("8-agents", [
    "bun",
    "-e",
    "import { createBuiltinAgents } from './src/agents/builtin-agents.ts'; const a = createBuiltinAgents(); process.exit(Object.keys(a).length === 8 ? 0 : 1)",
  ])
)

// 9. config-schema
checks.push(
  runCheck("config-schema", [
    "bun",
    "-e",
    "import { GuildConfigSchema } from './src/config/schema.ts'; const r = GuildConfigSchema.safeParse({}); process.exit(r.success ? 0 : 1)",
  ])
)

// --- Phase 2: Packed artifact validation ---

const tmpDir = `/tmp/guild-verify-${Date.now()}`
const tarballPath = `${tmpDir}/guild-pack.tgz`

// 10. pack — generate tarball equivalent to npm publish
Bun.spawnSync(["mkdir", "-p", tmpDir], { cwd: process.cwd() })
// npm pack outputs to cwd by default; we move the tarball to tmpDir after
const packResult = runCheckWithCwd("pack", ["npm", "pack"], process.cwd())
checks.push(packResult)

if (packResult.passed) {
  // Move the generated tarball to temp dir
  const lines = (packResult.output || "").split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("npm "))
  const tarballName = lines.pop() || ""
  const tarballSrc = join(process.cwd(), tarballName)
  const tarballDst = join(tmpDir, tarballName)
  if (tarballName && existsSync(tarballSrc)) {
    copyFileSync(tarballSrc, tarballDst)
    unlinkSync(tarballSrc)
  }

  // 11. install-packed — install the tarball in clean temp environment
  const installDir = `${tmpDir}/install`
  Bun.spawnSync(["mkdir", "-p", installDir], { cwd: process.cwd() })

  // Create a minimal package.json so bun can install the tarball
  Bun.write(
    `${installDir}/package.json`,
    JSON.stringify({ name: "guild-verify-fixture", private: true })
  )

  const installResult = runCheckWithCwd(
    "install-packed",
    ["bun", "add", tarballDst, "--no-cache"],
    installDir
  )
  checks.push(installResult)

  if (installResult.passed) {
    // 12. validate-packed-export — validate runtime export shape from installed artifact
    const pkgDir = installDir + "/node_modules/@runecraft/guild"
    checks.push(
      runCheckWithCwd("validate-packed-export", [
        "bun",
        "-e",
        `
import p from '${pkgDir}/dist/index.js';
import * as m from '${pkgDir}/dist/index.js';
const ok = typeof p === 'function' && typeof m.server === 'function';
process.exit(ok ? 0 : 1)
        `.trim(),
      ], installDir)
    )

    // 13. validate-packed-contract — verify default + server point to same function
    checks.push(
      runCheckWithCwd("validate-packed-contract", [
        "bun",
        "-e",
        `
import p from '${pkgDir}/dist/index.js';
import * as m from '${pkgDir}/dist/index.js';
process.exit(p === m.server ? 0 : 1)
        `.trim(),
      ], installDir)
    )

    // 14. validate-packed-cjs-require — verify CJS require compatibility
    checks.push(
      runCheckWithCwd("validate-packed-cjs-require", [
        "bun",
        "-e",
        `
const m = require('${pkgDir}/dist/index.js');
process.exit(typeof m.default === 'function' ? 0 : 1)
        `.trim(),
      ], installDir)
    )
  }

  // Cleanup
  Bun.spawnSync(["rm", "-rf", tmpDir], { cwd: process.cwd() })
}

// Print results
for (const check of checks) {
  const status = check.passed ? "✓ PASS" : "✗ FAIL"
  console.log(`${status}  ${check.name}`)
  if (!check.passed && check.output) {
    console.log(
      "       " + check.output.split("\n").slice(0, 5).join("\n       ")
    )
  }
}

const allPassed = checks.every((c) => c.passed)
console.log()
console.log(allPassed ? "ALL CHECKS PASSED ✓" : "SOME CHECKS FAILED ✗")
process.exit(allPassed ? 0 : 1)
