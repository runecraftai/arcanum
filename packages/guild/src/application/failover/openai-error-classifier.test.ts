import { describe, it, expect } from "bun:test"
import {
  classifyOpenAIFailoverError,
  isOpenAIFailoverEligible,
  type OpenAIFailoverClassification,
} from "./openai-error-classifier"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertEligible(result: OpenAIFailoverClassification, reason: string) {
  expect(result.eligible).toBe(true)
  expect(result.reason).toBe(reason)
  expect(result.provider).toBe("openai")
}

function assertNotEligible(result: OpenAIFailoverClassification, provider: "openai" | "other" | "unknown" = "unknown") {
  expect(result.eligible).toBe(false)
  expect(result.reason).toBe(null)
  expect(result.provider).toBe(provider)
}

// ─── Quota errors ─────────────────────────────────────────────────────────────

describe("quota exceeded errors", () => {
  it("recognises 'quota exceeded' string with openai marker", () => {
    const result = classifyOpenAIFailoverError("OpenAI error: quota exceeded")
    assertEligible(result, "quota")
  })

  it("recognises insufficient_quota error code", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "insufficient_quota",
          message: "You've exceeded your current quota, please check your plan and billing details.",
          code: "insufficient_quota",
        },
      }),
    )
    assertEligible(result, "quota")
  })

  it("recognises 'out of extra usage' message", () => {
    const result = classifyOpenAIFailoverError("OpenAI: You're out of extra usage. Add more at settings.")
    assertEligible(result, "quota")
  })

  it("recognises billing limit message", () => {
    const result = classifyOpenAIFailoverError("openai error — billing limit reached")
    assertEligible(result, "quota")
  })

  it("recognises usage limit message", () => {
    const result = classifyOpenAIFailoverError("openai: usage limit exceeded for this account")
    assertEligible(result, "quota")
  })
})

// ─── Rate limit errors ────────────────────────────────────────────────────────

describe("rate limit errors", () => {
  it("recognises 'rate limit' string with openai marker", () => {
    const result = classifyOpenAIFailoverError("OpenAI error: rate limit exceeded")
    assertEligible(result, "rate_limit")
  })

  it("recognises 429 status code with openai marker", () => {
    const result = classifyOpenAIFailoverError("OpenAI API returned 429 Too Many Requests")
    assertEligible(result, "rate_limit")
  })

  it("recognises rate_limit_exceeded error code", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "rate_limit_exceeded",
          message: "Rate limit exceeded",
        },
        provider: "openai",
      }),
    )
    assertEligible(result, "rate_limit")
  })

  it("recognises 'too many requests' message", () => {
    const result = classifyOpenAIFailoverError("openai: too many requests, please retry later")
    assertEligible(result, "rate_limit")
  })

  it("recognises 'requests per minute' message", () => {
    const result = classifyOpenAIFailoverError("OpenAI error: you exceeded requests per minute limit")
    assertEligible(result, "rate_limit")
  })

  it("recognises 'tokens per day' message", () => {
    const result = classifyOpenAIFailoverError("openai: tokens per day limit reached")
    assertEligible(result, "rate_limit")
  })
})

// ─── Model unavailable errors ─────────────────────────────────────────────────

describe("model unavailable errors", () => {
  it("recognises 'model unavailable' with openai marker", () => {
    const result = classifyOpenAIFailoverError("OpenAI: model unavailable")
    assertEligible(result, "model_unavailable")
  })

  it("recognises model_not_found error code", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "model_not_found",
          message: "The model does not exist",
        },
        provider: "openai",
      }),
    )
    assertEligible(result, "model_unavailable")
  })

  it("recognises 'model is overloaded' message", () => {
    const result = classifyOpenAIFailoverError("openai: model is overloaded, try again later")
    assertEligible(result, "model_unavailable")
  })

  it("recognises 503 service unavailable", () => {
    const result = classifyOpenAIFailoverError("OpenAI API error: 503 service unavailable")
    assertEligible(result, "model_unavailable")
  })

  it("recognises 502 bad gateway", () => {
    const result = classifyOpenAIFailoverError("openai: 502 bad gateway")
    assertEligible(result, "model_unavailable")
  })

  it("recognises 504 gateway timeout", () => {
    const result = classifyOpenAIFailoverError("openai: 504 gateway timeout")
    assertEligible(result, "model_unavailable")
  })
})

// ─── Non-eligible OpenAI errors ───────────────────────────────────────────────

describe("non-eligible OpenAI errors", () => {
  it("does NOT classify invalid_api_key as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: "Incorrect API key provided",
          code: "invalid_api_key",
        },
        provider: "openai",
      }),
    )
    assertNotEligible(result, "openai")
  })

  it("does NOT classify invalid prompt error as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: "messages.20: tool_use ids were found without tool_result blocks",
        },
        provider: "openai",
      }),
    )
    assertNotEligible(result, "openai")
  })

  it("does NOT classify context overflow as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: "This model's maximum context length is exceeded",
        },
        provider: "openai",
      }),
    )
    assertNotEligible(result, "openai")
  })

  it("does NOT classify permission error as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "permission_error",
          message: "OAuth authentication is currently not allowed",
        },
        provider: "openai",
      }),
    )
    assertNotEligible(result, "openai")
  })

  it("does NOT classify generic 400 as eligible", () => {
    const result = classifyOpenAIFailoverError("openai: 400 bad request")
    assertNotEligible(result, "openai")
  })

  it("does NOT classify generic 500 as eligible", () => {
    const result = classifyOpenAIFailoverError("openai: 500 internal server error")
    assertNotEligible(result, "openai")
  })
})

// ─── Non-OpenAI errors ────────────────────────────────────────────────────────

describe("non-OpenAI errors", () => {
  it("does NOT classify Anthropic quota as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: "You're out of extra usage. Add more at claude.ai/settings/usage.",
        },
        provider: "anthropic",
      }),
    )
    assertNotEligible(result, "other")
  })

  it("does NOT classify Anthropic permission error as eligible", () => {
    const result = classifyOpenAIFailoverError(
      JSON.stringify({
        error: {
          type: "permission_error",
          message: "OAuth authentication is currently not allowed for this organization.",
        },
        provider: "anthropic",
      }),
    )
    assertNotEligible(result, "other")
  })

  it("does NOT classify generic network error as eligible", () => {
    const result = classifyOpenAIFailoverError(new Error("network error: fetch failed"))
    assertNotEligible(result, "other")
  })

  it("does NOT classify random string as eligible", () => {
    const result = classifyOpenAIFailoverError("something went wrong")
    assertNotEligible(result, "other")
  })
})

// ─── Error shape variations ───────────────────────────────────────────────────

describe("error shape variations", () => {
  it("handles Error instance with openai message", () => {
    const err = new Error("OpenAI error: quota exceeded")
    const result = classifyOpenAIFailoverError(err)
    assertEligible(result, "quota")
  })

  it("handles object with data.message shape", () => {
    const result = classifyOpenAIFailoverError({
      data: { message: "OpenAI: rate limit exceeded" },
      statusCode: 429,
    })
    assertEligible(result, "rate_limit")
  })

  it("handles object with error.message shape", () => {
    const result = classifyOpenAIFailoverError({
      error: { message: "OpenAI: model unavailable" },
    })
    assertEligible(result, "model_unavailable")
  })

  it("handles object with direct message field", () => {
    const result = classifyOpenAIFailoverError({
      message: "openai: 429 rate limit",
      provider: "openai",
    })
    assertEligible(result, "rate_limit")
  })

  it("handles object with statusCode 429 and openai marker", () => {
    const result = classifyOpenAIFailoverError({
      statusCode: 429,
      message: "openai: 429 rate limit exceeded",
    })
    assertEligible(result, "rate_limit")
  })

  it("handles null input", () => {
    const result = classifyOpenAIFailoverError(null)
    assertNotEligible(result, "unknown")
  })

  it("handles undefined input", () => {
    const result = classifyOpenAIFailoverError(undefined)
    assertNotEligible(result, "unknown")
  })
})

// ─── Convenience helper ───────────────────────────────────────────────────────

describe("isOpenAIFailoverEligible", () => {
  it("returns true for eligible quota error", () => {
    expect(isOpenAIFailoverEligible("OpenAI: quota exceeded")).toBe(true)
  })

  it("returns true for eligible 429 error", () => {
    expect(isOpenAIFailoverEligible("openai: 429 rate limit exceeded")).toBe(true)
  })

  it("returns false for non-eligible error", () => {
    expect(isOpenAIFailoverEligible("openai: invalid API key")).toBe(false)
  })

  it("returns false for non-OpenAI error", () => {
    expect(isOpenAIFailoverEligible("anthropic: quota exceeded")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isOpenAIFailoverEligible(null)).toBe(false)
  })
})

// ─── Conservative behavior ────────────────────────────────────────────────────

describe("conservative behavior", () => {
  it("fails closed on ambiguous openai error", () => {
    const result = classifyOpenAIFailoverError("openai: unknown error occurred")
    assertNotEligible(result, "openai")
  })

  it("fails closed on partial match without openai marker", () => {
    // "quota exceeded" alone without any openai indicator should not match
    const result = classifyOpenAIFailoverError("quota exceeded")
    // This should NOT be eligible because there's no openai marker
    assertNotEligible(result, "other")
  })

  it("fails closed on empty string", () => {
    const result = classifyOpenAIFailoverError("")
    assertNotEligible(result, "other")
  })

  it("fails closed on non-object non-string input", () => {
    const result = classifyOpenAIFailoverError(42)
    assertNotEligible(result, "other")
  })
})
