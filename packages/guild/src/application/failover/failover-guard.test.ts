import { describe, it, expect, beforeEach } from "bun:test"
import { canAttemptFailover, markFailoverAttempted, resetFailoverGuard, clearFailoverGuard } from "./failover-guard"

describe("failover-guard", () => {
  beforeEach(() => {
    clearFailoverGuard()
  })

  it("allows failover on first check for a new key", () => {
    expect(canAttemptFailover("session-1:msg-1")).toBe(true)
  })

  it("blocks failover after marking it attempted", () => {
    const key = "session-1:msg-1"
    expect(canAttemptFailover(key)).toBe(true)

    markFailoverAttempted(key)

    expect(canAttemptFailover(key)).toBe(false)
  })

  it("tracks different keys independently", () => {
    const keyA = "session-1:msg-1"
    const keyB = "session-1:msg-2"

    markFailoverAttempted(keyA)

    expect(canAttemptFailover(keyA)).toBe(false)
    expect(canAttemptFailover(keyB)).toBe(true)
  })

  it("allows reset of a specific key", () => {
    const key = "session-1:msg-1"
    markFailoverAttempted(key)
    expect(canAttemptFailover(key)).toBe(false)

    resetFailoverGuard(key)

    expect(canAttemptFailover(key)).toBe(true)
  })

  it("clear removes all guard state", () => {
    markFailoverAttempted("key-1")
    markFailoverAttempted("key-2")

    clearFailoverGuard()

    expect(canAttemptFailover("key-1")).toBe(true)
    expect(canAttemptFailover("key-2")).toBe(true)
  })

  it("prevents repeated failover for the same execution (anti-loop)", () => {
    const key = "session-42:step-3"

    // First attempt: allowed
    expect(canAttemptFailover(key)).toBe(true)
    markFailoverAttempted(key)

    // Simulate: failover attempt fails, caller tries again
    // Second attempt: blocked — no loop
    expect(canAttemptFailover(key)).toBe(false)

    // Third attempt: still blocked
    expect(canAttemptFailover(key)).toBe(false)
  })
})
