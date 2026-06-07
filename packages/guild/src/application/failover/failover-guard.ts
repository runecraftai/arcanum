/**
 * One-shot failover guard: ephemeral in-memory state that prevents
 * automatic failover loops for the same execution/message.
 *
 * Design constraints:
 * - Maximum ONE automatic failover attempt per execution key
 * - State is process-scoped (cleared on restart)
 * - Smallest possible surface: a single Set<string>
 *
 * Usage:
 *   1. Before attempting failover, call `canAttemptFailover(key)`
 *   2. If true, call `markFailoverAttempted(key)` and proceed
 *   3. If false, propagate the original error — no retry
 *
 * The key should uniquely identify the execution context, typically
 * `${sessionId}:${messageId}` or just `${sessionId}` when messageId
 * is not available.
 */

const attemptedFailovers = new Set<string>()

/**
 * Check whether failover has NOT yet been attempted for this execution.
 * Returns true if failover is allowed (one-shot), false if already tried.
 */
export function canAttemptFailover(key: string): boolean {
  return !attemptedFailovers.has(key)
}

/**
 * Record that a failover attempt has been made for this execution.
 * Subsequent calls to `canAttemptFailover(key)` will return false.
 */
export function markFailoverAttempted(key: string): void {
  attemptedFailovers.add(key)
}

/**
 * Reset guard state for a specific key.
 * Only intended for testing or explicit session cleanup.
 */
export function resetFailoverGuard(key: string): void {
  attemptedFailovers.delete(key)
}

/**
 * Reset ALL guard state.
 * Only intended for testing.
 */
export function clearFailoverGuard(): void {
  attemptedFailovers.clear()
}
