/**
 * Tmux pane management with adaptive layout
 *
 * Layout logic (based on active pane count when spawning):
 *   0 active → split-window -h -p 30        [main | pane1]
 *   1 active → split pane1 -v -p 50         [main | pane1 ]
 *                                            [     | pane2 ]
 *   2+ active → split pane1 -h -p 40        [main | pane1 | pane3]
 *                                            [     | pane2 |      ]
 */

import { execSync, spawn } from "node:child_process";
import * as os from "node:os";

export interface PaneInfo {
	id: string;
	agentName: string;
	runScriptPath: string;
	pid?: number;
}

export class TmuxLayout {
	private activePanes: PaneInfo[] = [];

	isInTmux(): boolean {
		return Boolean(process.env.TMUX);
	}

	/** Spawn agent in a tmux pane (or background process if not in tmux) */
	createPane(agentName: string, runScriptPath: string): string {
		if (!this.isInTmux()) {
			return this.spawnBackground(agentName, runScriptPath);
		}
		return this.spawnTmuxPane(agentName, runScriptPath);
	}

	/** Remove pane from tracking and kill it */
	removePane(paneId: string): void {
		this.activePanes = this.activePanes.filter((p) => p.id !== paneId);

		if (paneId.startsWith("bg-")) {
			// Background process — kill by pid if we have it
			const info = this.activePanes.find((p) => p.id === paneId);
			if (info?.pid) {
				try {
					process.kill(info.pid, "SIGTERM");
				} catch {}
			}
			return;
		}

		// Kill tmux pane (may already be gone if pane auto-closed)
		try {
			execSync(`tmux kill-pane -t "${paneId}" 2>/dev/null`, { stdio: "ignore" });
		} catch {}
	}

	private spawnTmuxPane(agentName: string, runScriptPath: string): string {
		const count = this.activePanes.length;
		const cmd = `bash '${runScriptPath}'`;
		let paneId: string;

		try {
			if (count === 0) {
				// First pane: vertical split on the right, 30% width
				paneId = execSync(
					`tmux split-window -h -p 30 -d -P -F "#{pane_id}" "${cmd}"`,
				)
					.toString()
					.trim();
			} else if (count === 1) {
				// Second pane: horizontal split below first right pane
				const firstPane = this.activePanes[0].id;
				paneId = execSync(
					`tmux split-window -v -p 50 -d -t "${firstPane}" -P -F "#{pane_id}" "${cmd}"`,
				)
					.toString()
					.trim();
			} else {
				// Third+ pane: new vertical column to the right of existing column
				const firstPane = this.activePanes[0].id;
				paneId = execSync(
					`tmux split-window -h -p 40 -d -t "${firstPane}" -P -F "#{pane_id}" "${cmd}"`,
				)
					.toString()
					.trim();
			}
		} catch (err) {
			// Tmux command failed — fall back to background
			console.error(`[tmux-delegate] Failed to create pane: ${err}`);
			return this.spawnBackground(agentName, runScriptPath);
		}

		this.activePanes.push({ id: paneId, agentName, runScriptPath });
		return paneId;
	}

	private spawnBackground(agentName: string, runScriptPath: string): string {
		const id = `bg-${agentName}-${Date.now()}`;
		const proc = spawn("bash", [runScriptPath], {
			detached: true,
			stdio: "ignore",
			cwd: os.homedir(),
		});
		proc.unref();

		const info: PaneInfo = {
			id,
			agentName,
			runScriptPath,
			pid: proc.pid,
		};
		this.activePanes.push(info);
		return id;
	}

	get count(): number {
		return this.activePanes.length;
	}

	getActiveAgents(): string[] {
		return this.activePanes.map((p) => p.agentName);
	}
}
