import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ProjectIdentity {
	slug: string;
	rootPath: string;
	remoteUrl: string | null;
}

const SSH_REMOTE_RE = /^git@[^:]+:(.+?)(?:\.git)?$/;
const HTTPS_REMOTE_RE = /^https?:\/\/[^/]+\/(.+?)(?:\.git)?$/;

function normalizeRemoteUrl(url: string): string {
	const trimmed = url.trim();
	const ssh = trimmed.match(SSH_REMOTE_RE);
	if (ssh) return ssh[1];
	const https = trimmed.match(HTTPS_REMOTE_RE);
	if (https) return https[1];
	return trimmed.replace(/\.git$/, "");
}

function deriveSlugFromRemote(remoteUrl: string): string {
	const normalized = normalizeRemoteUrl(remoteUrl);
	const segments = normalized.split("/").filter(Boolean);
	if (segments.length === 0) return normalized;
	return segments[segments.length - 1] ?? normalized;
}

function findGitRoot(start: string): string | null {
	let current = isAbsolute(start) ? start : resolve(start);
	const { root } = { root: "/" };
	while (true) {
		if (existsSync(joinPath(current, ".git"))) return current;
		const parent = resolve(current, "..");
		if (parent === current || parent === root) return null;
		current = parent;
	}
}

function joinPath(dir: string, child: string): string {
	return dir.endsWith(sep) ? `${dir}${child}` : `${dir}${sep}${child}`;
}

async function readRemoteUrl(gitRoot: string): Promise<string | null> {
	try {
		const { stdout } = await execFileAsync("git", ["-C", gitRoot, "config", "--get", "remote.origin.url"], {
			timeout: 1000,
			windowsHide: true,
		});
		const url = stdout.trim();
		return url.length > 0 ? url : null;
	} catch {
		return null;
	}
}

export async function resolveProjectSlug(cwd: string): Promise<ProjectIdentity> {
	const envOverride = process.env.RUNES_PROJECT_SLUG;
	const absoluteCwd = isAbsolute(cwd) ? cwd : resolve(cwd);

	const gitRoot = findGitRoot(absoluteCwd);
	if (gitRoot) {
		const remoteUrl = await readRemoteUrl(gitRoot);
		if (remoteUrl) {
			return {
				slug: envOverride ?? deriveSlugFromRemote(remoteUrl),
				rootPath: gitRoot,
				remoteUrl,
			};
		}
	}

	return {
		slug: envOverride ?? absoluteCwd,
		rootPath: gitRoot ?? absoluteCwd,
		remoteUrl: null,
	};
}
