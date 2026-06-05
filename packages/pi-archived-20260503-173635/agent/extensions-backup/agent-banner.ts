// ABOUTME: Displays ASCII art banner above the editor on session start.
// ABOUTME: Runecraft themed banner — mystical, purple/cyan accents.

/**
 * Agent Banner — Runecraft themed ASCII art at the top of pi app
 *
 * Displays the familiar rune logo/banner above the editor when session starts.
 * Hides automatically on first user input.
 *
 * Usage: Add to packages in settings.json
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./lib/themeMap.ts";

const RUNECRAFT_ART = `
    ⟡ FAMILIAR                    @runecraft/familiar
                                                    
   ╔═══════════════════════════════════════════╗
   ║  ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮   ║
   ║  │  Herald · Scout · Sage · Forge      │   ║
   ║  │  Ward · Arbiter                      │   ║
   ║  │  ───────────────────────────────────│   ║
   ║  │  Multi-Agent Orchestration           │   ║
   ║  ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯   ║
   ╚═══════════════════════════════════════════╝
`;

function loadArt(): string {
	return RUNECRAFT_ART;
}

export function showBanner(ctx: ExtensionContext) {
	if (!ctx.hasUI) return;

	const art = loadArt();
	const split = art.split("\n");
	const firstNonEmpty = split.findIndex((l) => l.trim() !== "");
	const lines = firstNonEmpty >= 0 ? split.slice(firstNonEmpty) : split;

	ctx.ui.setWidget(
		"agent-banner",
		(_tui, theme) => ({
			invalidate() {},
			render(width: number): string[] {
				// Use purple for banner, cyan for accents
				const rendered = lines.map((line) => {
					if (line.includes("FAMILIAR") || line.includes("║")) {
						return theme.fg("accent", line); // purple
					}
					if (line.includes("·") || line.includes("─")) {
						return theme.fg("dim", line); // muted
					}
					return theme.fg("text", line);
				});
				rendered.push("");
				return rendered;
			},
		}),
		{ placement: "aboveEditor" },
	);
}

let bannerCtx: ExtensionContext | null = null;
let bannerVisible = false;

export function isBannerVisible(): boolean {
	return bannerVisible;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx: ExtensionContext) => {
		applyExtensionDefaults(import.meta.url, ctx);
		bannerCtx = ctx;
		bannerVisible = true;
		showBanner(ctx);
	});

	pi.on("session_switch", async (_event, ctx: ExtensionContext) => {
		bannerCtx = ctx;
		bannerVisible = true;
		showBanner(ctx);
	});

	pi.on("input", async () => {
		if (bannerCtx?.hasUI) {
			bannerCtx.ui.setWidget("agent-banner", undefined);
			bannerVisible = false;
		}
	});
}
