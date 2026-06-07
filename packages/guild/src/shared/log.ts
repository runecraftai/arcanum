export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === "DEBUG" || value === "INFO" || value === "WARN" || value === "ERROR") {
    return value
  }
  return "INFO"
}

let activeLevel: LogLevel = parseLogLevel(process.env.GUILD_LOG_LEVEL)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: { app: { log: (opts?: any) => Promise<unknown> } } | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setClient(c: { app: { log: (opts?: any) => Promise<unknown> } } | null): void {
  client = c
}

export function setLogLevel(level: LogLevel): void {
  activeLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[activeLevel]
}

function emit(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return

  // Test sink: capture all emissions regardless of client
  if (testSink) {
    testSink({ level, message, data })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = (client as any)?.app
  if (appRef && typeof appRef.log === "function") {
    const extra =
      data !== undefined
        ? typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : { value: data }
        : undefined
    // Call log as a method on app to preserve `this` binding (the SDK's
    // generated classes access `this._client` internally).
    appRef.log(
      { body: { service: "guild", level: level.toLowerCase(), message, extra } },
    ).catch(() => {})
  } else {
    if (level === "ERROR" || level === "WARN") {
      console.error(`[guild:${level}] ${message}`, data ?? "")
    }
    // DEBUG and INFO are silently dropped before client is set
  }
}

export function debug(message: string, data?: unknown): void {
  emit("DEBUG", message, data)
}

export function info(message: string, data?: unknown): void {
  emit("INFO", message, data)
}

export function warn(message: string, data?: unknown): void {
  emit("WARN", message, data)
}

export function error(message: string, data?: unknown): void {
  emit("ERROR", message, data)
}

export function log(message: string, data?: unknown): void {
  info(message, data)
}

export interface DelegationEvent {
  phase: "start" | "complete" | "error"
  agent: string
  sessionId?: string
  toolCallId?: string
  durationMs?: number
  summary?: string
}

export function logDelegation(event: DelegationEvent): void {
  const prefix = `[delegation:${event.phase}]`
  log(`${prefix} agent=${event.agent}`, {
    sessionId: event.sessionId,
    toolCallId: event.toolCallId,
    durationMs: event.durationMs,
    summary: event.summary,
  })
}

// ─── Failover structured logging ──────────────────────────────────────────────

export type FailoverStatus =
  | "eligible_retry"
  | "blocked_loop"
  | "no_model_tracked"
  | "no_fallback_available"
  | "retry_succeeded"
  | "retry_failed"
  | "error_ignored"

export interface FailoverLogEvent {
  /** Unique status describing the failover decision outcome */
  status: FailoverStatus
  /** Session ID where the failover occurred */
  sessionId: string
  /** Agent name (if available) */
  agent?: string
  /** Model that was active when the error occurred */
  currentModel?: string
  /** Model selected as fallback (if resolution succeeded) */
  nextModel?: string
  /** Classification reason from the error classifier */
  reason?: string | null
  /** Guard key used for loop prevention */
  failoverKey?: string
  /** Human-readable summary for quick scanning */
  summary?: string
}

/**
 * Emit a structured log for a failover event.
 *
 * Every failover decision (eligible retry, blocked loop, ignored error, etc.)
 * should log through this function so the team can trace fallback behavior
 * without deep manual investigation.
 */
export function logFailoverEvent(event: FailoverLogEvent): void {
  const level: LogLevel = event.status === "retry_succeeded" ? "INFO" :
                          event.status === "error_ignored" ? "DEBUG" :
                          "WARN"

  const summary = event.summary ?? `[failover:${event.status}] session=${event.sessionId}`

  emit(level, summary, {
    status: event.status,
    sessionId: event.sessionId,
    agent: event.agent,
    currentModel: event.currentModel,
    nextModel: event.nextModel,
    reason: event.reason,
    failoverKey: event.failoverKey,
  })
}

// ─── Test sink (for capturing log events in tests) ────────────────────────────

type LogEntry = { level: LogLevel; message: string; data?: unknown }

let testSink: ((entry: LogEntry) => void) | null = null

/**
 * Install a test sink to capture all log emissions.
 * Returns a cleanup function that removes the sink and returns captured entries.
 * Only intended for testing.
 */
export function installTestSink(): { entries: LogEntry[]; uninstall: () => LogEntry[] } {
  const entries: LogEntry[] = []
  testSink = (entry: LogEntry) => {
    entries.push(entry)
  }
  return {
    entries,
    uninstall: () => {
      testSink = null
      return entries
    },
  }
}
