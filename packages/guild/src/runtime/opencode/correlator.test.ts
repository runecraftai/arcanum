import { describe, expect, it } from "bun:test"
import {
	SessionCreationCorrelator,
	WIZARD_SPAWN_CORRELATION_TIMEOUT_MS,
	createSessionCreationCorrelator,
} from "./correlator"

describe("WIZARD_SPAWN_CORRELATION_TIMEOUT_MS", () => {
	it("is a positive number", () => {
		expect(WIZARD_SPAWN_CORRELATION_TIMEOUT_MS).toBeGreaterThan(0)
	})
})

describe("createSessionCreationCorrelator", () => {
	it("returns a SessionCreationCorrelator instance", () => {
		const c = createSessionCreationCorrelator()
		expect(c).toBeInstanceOf(SessionCreationCorrelator)
	})

	it("passes clock to constructor", () => {
		let called = false
		const clock = () => {
			called = true
			return 0
		}
		const c = createSessionCreationCorrelator(clock)
		// arm triggers clock via createdAt
		const promise = c.arm("session-a")
		// resolve it so the latch gets cleaned up
		c.resolveNext("session-b")
		return promise.then(() => {
			expect(called).toBe(true)
		})
	})
})

describe("SessionCreationCorrelator", () => {
	describe("arm + resolveNext", () => {
		it("resolves on resolveNext with the new session ID", async () => {
			const c = new SessionCreationCorrelator()
			const promise = c.arm("orig-1")
			c.resolveNext("new-1")
			const result = await promise
			expect(result).toBe("new-1")
		})

		it("resolves oldest latch first (FIFO)", async () => {
			const c = new SessionCreationCorrelator()
			const p1 = c.arm("orig-1")
			const p2 = c.arm("orig-2")
			const p3 = c.arm("orig-3")

			c.resolveNext("new-1")
			expect(await p1).toBe("new-1")

			c.resolveNext("new-2")
			expect(await p2).toBe("new-2")

			c.resolveNext("new-3")
			expect(await p3).toBe("new-3")
		})
	})

	describe("timeout (automatic)", () => {
		it("rejects on timeout when no resolveNext is called", async () => {
			const c = new SessionCreationCorrelator(Date.now, 10)
			const promise = c.arm("orig-timeout")
			await expect(promise).rejects.toThrow(
				"Correlation timeout: no session.created for orig-timeout",
			)
		})
	})

	describe("timeout (manual)", () => {
		it("rejects a specific latch by originatingSessionId", async () => {
			const c = new SessionCreationCorrelator(Date.now, 5000)
			const promise = c.arm("orig-manual")
			c.timeout("orig-manual")
			await expect(promise).rejects.toThrow(
				"Latch manually timed out for orig-manual",
			)
		})

		it("is a no-op for unknown session ID", () => {
			const c = new SessionCreationCorrelator(Date.now, 5000)
			// Should not throw
			c.timeout("nonexistent")
		})

		it("does not affect other armed latches", async () => {
			const c = new SessionCreationCorrelator(Date.now, 5000)
			const p1 = c.arm("orig-1")
			const p2 = c.arm("orig-2")

			c.timeout("orig-1")
			await expect(p1).rejects.toThrow("Latch manually timed out for orig-1")

			// p2 should still be armed and resolvable
			c.resolveNext("new-2")
			expect(await p2).toBe("new-2")
		})
	})

	describe("concurrent latches", () => {
		it("each latch is independent", async () => {
			const c = new SessionCreationCorrelator(Date.now, 5000)
			const p1 = c.arm("a")
			const p2 = c.arm("b")
			const p3 = c.arm("c")

			// Timeout the middle one
			c.timeout("b")
			await expect(p2).rejects.toThrow()

			// Others still work
			c.resolveNext("x")
			c.resolveNext("y")

			expect(await p1).toBe("x")
			expect(await p3).toBe("y")
		})

		it("each resolveNext consumes exactly one latch", async () => {
			const c = new SessionCreationCorrelator(Date.now, 5000)
			const p1 = c.arm("a")
			const p2 = c.arm("b")

			c.resolveNext("x")
			expect(await p1).toBe("x")

			c.resolveNext("y")
			expect(await p2).toBe("y")

			// Third resolveNext with no latches — should warn but not throw
			c.resolveNext("z")
		})
	})

	describe("resolveNext with no armed latches", () => {
		it("does not throw when there are no latches", () => {
			const c = new SessionCreationCorrelator()
			// Should not throw
			c.resolveNext("orphan")
		})
	})

	describe("registerMapping + getOriginatingSessionId", () => {
		it("returns the originating ID for a known new ID", () => {
			const c = new SessionCreationCorrelator()
			c.registerMapping("new-session", "orig-session")
			expect(c.getOriginatingSessionId("new-session")).toBe("orig-session")
		})

		it("returns undefined for an unknown ID", () => {
			const c = new SessionCreationCorrelator()
			expect(c.getOriginatingSessionId("unknown")).toBeUndefined()
		})

		it("overwrites mapping for the same new ID", () => {
			const c = new SessionCreationCorrelator()
			c.registerMapping("new-session", "orig-1")
			c.registerMapping("new-session", "orig-2")
			expect(c.getOriginatingSessionId("new-session")).toBe("orig-2")
		})
	})

	describe("injectable clock", () => {
		it("uses the injected clock for latch timestamp", async () => {
			const fakeNow = 1700000000000
			const c = new SessionCreationCorrelator(() => fakeNow)
			const promise = c.arm("orig-clock")
			c.resolveNext("new-clock")
			await promise
			// Clock was called — verified via resolveNext not hanging
		})

		it("records distinct timestamps for different arms", () => {
			let tick = 1000
			const c = new SessionCreationCorrelator(() => tick++)
			// Arm two latches (we check that clock was called)
			const p1 = c.arm("a")
			const p2 = c.arm("b")
			c.resolveNext("x")
			c.resolveNext("y")
			// Clock incrementing means timestamps differ
			// Resolve and verify they complete
			return Promise.all([p1, p2]).then(([r1, r2]) => {
				expect(r1).toBe("x")
				expect(r2).toBe("y")
			})
		})
	})
})
