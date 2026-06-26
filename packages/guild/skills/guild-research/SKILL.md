---
name: guild-research
description: >
  Research internal code or external references before changing Guild behavior.
  Use when the answer requires exploration rather than direct implementation.
license: CC-BY-4.0
---

# guild-research

Find the facts first.

## Overview

Search the codebase for existing patterns and dependencies before reaching for external docs. Return concise findings with file references. Cite sources inline. Do not paraphrase conclusions as facts — every claim must trace to a specific file, line, URL, or doc section.

## When to Use

- The answer to the user's question lives in the codebase or in upstream docs.
- The next step is research, not implementation.
- The user wants a sourced answer, not an opinion.

**Do NOT use for**: spec authoring (use `guild-spec`), planning (use `guild-plan`), implementation (use `guild-execute`), or verification (use `guild-verify`).

## Primary inputs

- The user's question or research target
- The codebase (read-only — no edits during research)
- External documentation (read-only — no edits)

## Primary outputs

- Inline findings in the agent's response, each with a file path, line number, URL, or doc section citation.
- A short summary at the end: "Findings:" list with one line per claim.

## Process

1. Read the user's question. Identify the noun (file, function, API, library) and the verb (find, compare, trace, locate).
2. Search the codebase first. Use grep and glob to find file paths and line numbers. Read the relevant code, not the surrounding code.
3. Cross-check internal findings against any prior `knowledge/decisions.md` or `knowledge/gotchas.md` entries. A prior decision may already answer the question.
4. Reach for external docs only when internal code is insufficient. Prefer official docs over blog posts. Quote sparingly and cite the URL.
5. Distinguish between "found this" (a file, a URL) and "concluded this" (an inference). Conclusions cite the findings that support them.
6. If the answer is ambiguous, record the ambiguity in the response. Do not paper over it.
7. Return findings inline with citations. End with a one-line summary per claim.

## Rationalizations

A research skill's Rationalizations table rebuts the excuses agents use to skip sourcing.

| Excuse | Rebuttal |
| --- | --- |
| "I remember the API, I don't need to read the code." | Step 2 requires reading the relevant code. Memory is not a citation; the file path is. |
| "The official docs are clear, I don't need to cite the URL." | Step 4 requires the URL inline. "Clear" is not a citation. |
| "This is a small question, no need for a summary." | Step 7 requires a one-line summary per claim. Small questions still get a Findings list. |
| "I'll just answer with my best guess." | Step 5 distinguishes "found" from "concluded". Guesses are conclusions without findings; the table rebuts them. |
| "The codebase is large, I'll just point to the directory." | Step 2 requires file path + line number. Directory-level answers are not findings. |

## Red Flags

- A claim in the response has no citation (no file path, no line number, no URL).
- "Found" and "concluded" are mixed: a conclusion is stated without the finding that supports it.
- External blog post cited over official docs when official docs exist.
- The agent paraphrases the answer in its own words without quoting or pointing to the source.
- The response ends without a Findings list.

## Verification

The skill is complete when ALL of the following evidence is present:

- Every claim in the response cites a file path + line number, a URL, or a doc section.
- Internal code was searched before external docs (or the absence of internal code was noted).
- The response distinguishes "found this" from "concluded this".
- The response ends with a Findings list, one line per claim.
- If the answer is ambiguous, the ambiguity is recorded.

**"Seems right" is not evidence.** Every research claim cites a source.

## See also

- [guild-recon](guild-recon) — broader codebase exploration (this skill targets a specific question).
- [guild-spec](guild-spec) — consumes research findings to write a feature spec.
- [.guild/architecture.md](/.guild/architecture.md) — `knowledge/` layout for prior decisions.
