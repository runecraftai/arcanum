import { debug, warn } from "../../shared/log"

export const WIZARD_SPAWN_CORRELATION_TIMEOUT_MS = 1500

type Clock = () => number

interface Latch {
	originatingSessionId: string
	resolve: (newId: string) => void
	reject: (err: Error) => void
	timer: ReturnType<typeof setTimeout>
	createdAt: number
}

export class SessionCreationCorrelator {
	#latches: Latch[] = []
	#mappings = new Map<string, string>()
	#clock: Clock
	#timeoutMs: number

	constructor(clock: Clock = Date.now, timeoutMs: number = WIZARD_SPAWN_CORRELATION_TIMEOUT_MS) {
		this.#clock = clock
		this.#timeoutMs = timeoutMs
	}

	arm(originatingSessionId: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#removeLatchByTimer(originatingSessionId, timer)
				reject(new Error(`Correlation timeout: no session.created for ${originatingSessionId}`))
			}, this.#timeoutMs)

			const latch: Latch = {
				originatingSessionId,
				resolve,
				reject,
				timer,
				createdAt: this.#clock(),
			}

			this.#latches.push(latch)
			debug("[correlator] armed latch", { originatingSessionId, queueLength: this.#latches.length })
		})
	}

	resolveNext(newId: string): void {
		const latch = this.#latches.shift()
		if (!latch) {
			warn("[correlator] resolveNext called with no armed latches", { newId })
			return
		}

		clearTimeout(latch.timer)
		debug("[correlator] resolving latch", { originatingSessionId: latch.originatingSessionId, newId })
		latch.resolve(newId)
	}

	timeout(originatingSessionId: string): void {
		const index = this.#latches.findIndex((l) => l.originatingSessionId === originatingSessionId)
		if (index === -1) return

		const [latch] = this.#latches.splice(index, 1)
		clearTimeout(latch.timer)
		latch.reject(new Error(`Latch manually timed out for ${originatingSessionId}`))
		debug("[correlator] latch manually timed out", { originatingSessionId, queueLength: this.#latches.length })
	}

	registerMapping(newId: string, originatingId: string): void {
		this.#mappings.set(newId, originatingId)
		debug("[correlator] registered mapping", { newId, originatingId })
	}

	getOriginatingSessionId(newId: string): string | undefined {
		return this.#mappings.get(newId)
	}

	#removeLatchByTimer(originatingSessionId: string, timer: ReturnType<typeof setTimeout>): void {
		const index = this.#latches.findIndex(
			(l) => l.originatingSessionId === originatingSessionId && l.timer === timer,
		)
		if (index === -1) return
		this.#latches.splice(index, 1)
		debug("[correlator] latch auto-timed out", { originatingSessionId, queueLength: this.#latches.length })
	}
}

export function createSessionCreationCorrelator(
	clock?: Clock,
	timeoutMs?: number,
): SessionCreationCorrelator {
	return new SessionCreationCorrelator(clock, timeoutMs)
}
