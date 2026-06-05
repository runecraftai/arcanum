// ABOUTME: Pure functions for cycling operational modes.
// ABOUTME: Runecraft themed — NORMAL (default) and PLAN (spec-driven with purple bar).

export const MODES = ["NORMAL", "PLAN"] as const;
export type Mode = typeof MODES[number];

// For other extensions that need all modes (backward compat)
export const ALL_MODES = ["NORMAL", "PLAN", "SPEC", "PIPELINE", "TEAM", "CHAIN"] as const;

/** Advance to the next mode in the cycle (Runecraft: NORMAL ↔ PLAN). */
export function nextMode(current: Mode): Mode {
	const idx = MODES.indexOf(current);
	return MODES[(idx + 1) % MODES.length];
}

/** Go back to the previous mode in the cycle. */
export function prevMode(current: Mode): Mode {
	const idx = MODES.indexOf(current);
	return MODES[(idx - 1 + MODES.length) % MODES.length];
}

// ── Colors ─────────────────────────────────────────────────────────────────

/** Theme color name for a mode. NORMAL returns empty (no color). */
export function modeColor(mode: Mode): string {
	return mode === "NORMAL" ? "" : "accent";
}

/** ANSI text color for the mode bar. */
export function modeTextAnsi(mode: Mode): string {
	return mode === "NORMAL" ? "" : "\x1b[1;97m"; // bold white
}

/** ANSI background color for the mode bar. */
export function modeBgAnsi(mode: Mode): string {
	if (mode === "NORMAL") return "";
	// Runecraft purple for PLAN mode
	return "\x1b[48;2;187;154;247m"; // purple rgb(187,154,247)
}

/** Status label for a mode. NORMAL returns empty, PLAN returns "[PLAN]". */
export function modeLabel(mode: Mode): string {
	return mode === "NORMAL" ? "" : `[${mode}]`;
}
