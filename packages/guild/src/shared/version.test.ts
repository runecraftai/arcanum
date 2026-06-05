import { describe, it, expect } from "bun:test"
import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { getGuildVersion } from "./version"

describe("getGuildVersion", () => {
  it("returns a semver-like string", () => {
    const version = getGuildVersion()
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it("returns the same value on repeated calls (caching)", () => {
    const first = getGuildVersion()
    const second = getGuildVersion()
    expect(first).toBe(second)
  })

  it("matches the version in package.json", () => {
    const thisDir = dirname(fileURLToPath(import.meta.url))
    const pkg = JSON.parse(readFileSync(join(thisDir, "../../package.json"), "utf-8"))
    expect(getGuildVersion()).toBe(pkg.version)
  })
})
