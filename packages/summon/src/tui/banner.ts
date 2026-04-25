import * as clack from "@clack/prompts";

/**
 * Display ASCII art banner for the summon CLI
 */
export function showBanner(): void {
  const banner = `
╔════════════════════════════════════════════════════════╗
║                       ARCANUM                          ║
║                   AGENT SKILLS MANAGER                 ║
╚════════════════════════════════════════════════════════╝
`;

  clack.intro(banner);
}
