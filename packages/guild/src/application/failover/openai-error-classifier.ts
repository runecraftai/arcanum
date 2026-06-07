/**
 * Conservative OpenAI failover error classifier.
 *
 * Recognises only errors eligible for automatic model failover:
 *   - quota exceeded
 *   - rate limit / 429
 *   - model unavailable (transient)
 *
 * All other errors return eligible=false. When in doubt, the classifier
 * fails closed (conservative) and does NOT trigger failover.
 */

export type FailoverReason = "quota" | "rate_limit" | "model_unavailable"

export interface OpenAIFailoverClassification {
  eligible: boolean
  reason: FailoverReason | null
  provider: "openai" | "other" | "unknown"
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classify a runtime error to determine whether automatic failover is eligible.
 *
 * Accepts any error shape (exception, SSE payload, ApiError-like object) and
 * inspects stringifiable fields for known OpenAI quota/rate-limit/unavailable
 * signals.
 *
 * Conservative by design: if the error cannot be confidently identified as an
 * eligible OpenAI error, returns { eligible: false, reason: null, provider: "unknown" }.
 */
export function classifyOpenAIFailoverError(error: unknown): OpenAIFailoverClassification {
  if (error == null) {
    return NOT_ELIGIBLE
  }

  const text = normaliseErrorText(error)

  // Gate 1: must look like OpenAI
  const isOpenAI = looksLikeOpenAIError(text, error)
  if (!isOpenAI) {
    return { eligible: false, reason: null, provider: "other" }
  }

  // Gate 2: check allowlisted reasons (conservative — explicit patterns only)
  const reason = matchEligibleReason(text)
  if (reason === null) {
    return { eligible: false, reason: null, provider: "openai" }
  }

  return { eligible: true, reason, provider: "openai" }
}

/**
 * Typed helper: check whether an error is an eligible OpenAI failover error.
 * Convenience wrapper around classifyOpenAIFailoverError.
 */
export function isOpenAIFailoverEligible(error: unknown): boolean {
  return classifyOpenAIFailoverError(error).eligible
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const NOT_ELIGIBLE: OpenAIFailoverClassification = Object.freeze({
  eligible: false,
  reason: null,
  provider: "unknown",
})

/**
 * Convert any error value to a lowercase searchable string.
 * Handles Error instances, objects with message/data/statusCode fields,
 * plain strings, and anything else via JSON.stringify.
 */
function normaliseErrorText(error: unknown): string {
  if (typeof error === "string") {
    return error.toLowerCase()
  }

  if (error instanceof Error) {
    return error.message.toLowerCase()
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>

    // Common shapes: { message }, { data: { message } }, { error: { message } }
    const directMessage = getStringField(obj, "message")
    if (directMessage) return directMessage.toLowerCase()

    const dataMessage = getStringField(obj, "data")
    if (dataMessage) return dataMessage.toLowerCase()

    const errorMessage = getStringField(obj, "error")
    if (errorMessage) return errorMessage.toLowerCase()

    // Try status code based hints
    const statusCode = getNumberField(obj, "statusCode") ?? getNumberField(obj, "status")
    if (statusCode !== null) {
      return `status ${statusCode}`.toLowerCase()
    }

    // Fallback: JSON stringify
    try {
      return JSON.stringify(error).toLowerCase()
    } catch {
      return String(error).toLowerCase()
    }
  }

  return String(error).toLowerCase()
}

/**
 * Extract a string field from an object, including nested { message } objects.
 */
function getStringField(obj: Record<string, unknown>, field: string): string | null {
  const value = obj[field]
  if (typeof value === "string") return value

  if (typeof value === "object" && value !== null) {
    const nested = (value as Record<string, unknown>).message
    if (typeof nested === "string") return nested
  }

  return null
}

function getNumberField(obj: Record<string, unknown>, field: string): number | null {
  const value = obj[field]
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

/**
 * Determine whether the error text (or object) originates from OpenAI.
 *
 * Looks for provider identifiers in the stringified error. This prevents
 * misclassifying Anthropic, Google, or generic network errors as OpenAI.
 */
function looksLikeOpenAIError(text: string, raw: unknown): boolean {
  const openAIMarkers = [
    "openai",
    "x-request-id",        // OpenAI response header often logged
    "invalid_api_key",      // OpenAI error code
    "insufficient_quota",   // OpenAI error code
    "rate_limit_exceeded",  // OpenAI error code
  ]

  for (const marker of openAIMarkers) {
    if (text.includes(marker)) return true
  }

  // Also check raw object for provider field
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>
    const provider = getStringField(obj, "provider")
    if (provider && provider.toLowerCase().includes("openai")) return true

    // Check nested error type
    const errorType = getStringField(obj, "type")
    if (errorType && errorType.includes("openai")) return true
  }

  return false
}

/**
 * Match the error text against the allowlisted eligible reasons.
 *
 * Returns the first matching reason or null if none match.
 * Patterns are intentionally narrow to avoid false positives.
 */
function matchEligibleReason(text: string): FailoverReason | null {
  // Quota exceeded patterns
  const quotaPatterns = [
    "quota exceeded",
    "insufficient_quota",
    "you've exceeded your current quota",
    "you have exceeded your current quota",
    "out of extra usage",          // Anthropic-pro shape that may route through
    "billing limit",
    "usage limit",
  ]
  for (const pattern of quotaPatterns) {
    if (text.includes(pattern)) return "quota"
  }

  // Rate limit patterns
  const rateLimitPatterns = [
    "rate limit",
    "rate_limit",
    "rate_limit_exceeded",
    "too many requests",
    "429",
    "requests per minute",
    "requests per day",
    "tokens per minute",
    "tokens per day",
  ]
  for (const pattern of rateLimitPatterns) {
    if (text.includes(pattern)) return "rate_limit"
  }

  // Model unavailable patterns (transient)
  const modelUnavailablePatterns = [
    "model unavailable",
    "model_not_found",
    "the model does not exist",
    "model is overloaded",
    "service unavailable",
    "503",
    "529",
    "bad gateway",
    "gateway timeout",
    "502",
    "504",
  ]
  for (const pattern of modelUnavailablePatterns) {
    if (text.includes(pattern)) return "model_unavailable"
  }

  return null
}
