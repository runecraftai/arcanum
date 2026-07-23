import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "fs"
import { execFileSync, execSync } from "child_process"
import { basename, dirname, extname, join } from "path"
import type { PlanProgress, SessionRuntimeState, WorkState } from "../../features/work-state/types"
import { PLANS_DIR, SESSION_RUNTIME_DIR, GUILD_DIR, WORK_STATE_FILE } from "../../features/work-state/constants"

const CANONICAL_TRIO_FILES = ["tasks.md", "spec.md", "design.md", "state.md"] as const

const UncheckedRegex = /^[-*]\s*\[\s*\]/gm
const CheckedRegex = /^[-*]\s*\[[xX]\]/gm

export function readWorkStateFromFs(directory: string): WorkState | null {
  const filePath = join(directory, GUILD_DIR, WORK_STATE_FILE)
  try {
    if (!existsSync(filePath)) {
      return null
    }

    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    if (typeof parsed.active_plan !== "string") {
      return null
    }
    if (!Array.isArray(parsed.session_ids)) {
      parsed.session_ids = []
    }

    return parsed as WorkState
  } catch {
    return null
  }
}

export function writeWorkStateToFs(directory: string, state: WorkState): boolean {
  try {
    const workDir = join(directory, GUILD_DIR)
    if (!existsSync(workDir)) {
      mkdirSync(workDir, { recursive: true })
    }

    writeFileSync(join(workDir, WORK_STATE_FILE), JSON.stringify(state, null, 2), "utf-8")
    return true
  } catch {
    return false
  }
}

export function clearWorkStateFromFs(directory: string): boolean {
  const filePath = join(directory, GUILD_DIR, WORK_STATE_FILE)
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
    return true
  } catch {
    return false
  }
}

export function appendSessionIdInFs(directory: string, sessionId: string): WorkState | null {
  const state = readWorkStateFromFs(directory)
  if (!state) {
    return null
  }
  if (!state.session_ids.includes(sessionId)) {
    state.session_ids.push(sessionId)
    writeWorkStateToFs(directory, state)
  }

  return state
}

export function createWorkStateRecord(planPath: string, sessionId: string, agent?: string, directory?: string): WorkState {
  const startSha = directory ? getHeadShaFromFs(directory) : undefined
  const startBranch = directory ? getBranchFromFs(directory) : undefined

  return {
    active_plan: planPath,
    started_at: new Date().toISOString(),
    session_ids: [sessionId],
    plan_name: getPlanNameFromPath(planPath),
    ...(agent !== undefined ? { agent } : {}),
    ...(startSha !== undefined ? { start_sha: startSha } : {}),
    ...(startBranch !== undefined ? { start_branch: startBranch } : {}),
  }
}

export function getHeadShaFromFs(directory: string): string | undefined {
  try {
    const sha = execSync("git rev-parse HEAD", {
      cwd: directory,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()

    return sha || undefined
  } catch {
    return undefined
  }
}

export function getBranchFromFs(directory: string): string | undefined {
  try {
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: directory,
      encoding: "utf-8",
    }).trim()

    return branch || undefined
  } catch {
    return undefined
  }
}

function resolveCanonicalTrioInDir(dir: string): string | null {
  for (const name of CANONICAL_TRIO_FILES) {
    const p = join(dir, name)
    if (existsSync(p)) return p
  }
  return null
}

export function findPlansInFs(directory: string): string[] {
  const plansDir = join(directory, PLANS_DIR)
  try {
    if (!existsSync(plansDir)) {
      return []
    }

    const results: { path: string; mtime: number }[] = []

    function walk(dir: string): void {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === "archive") continue
          if (dir === plansDir) {
            const canonical = resolveCanonicalTrioInDir(fullPath)
            if (canonical) {
              results.push({ path: canonical, mtime: statSync(canonical).mtimeMs })
              continue
            }
          }
          walk(fullPath)
        } else if (entry.isFile() && extname(entry.name) === ".md") {
          results.push({ path: fullPath, mtime: statSync(fullPath).mtimeMs })
        }
      }
    }

    walk(plansDir)

    return results
      .sort((left, right) => right.mtime - left.mtime)
      .map((entry) => entry.path)
  } catch {
    return []
  }
}

export function getPlanProgressFromFs(planPath: string): PlanProgress {
  if (!existsSync(planPath)) {
    return { total: 0, completed: 0, isComplete: true }
  }

  try {
    const content = readFileSync(planPath, "utf-8")
    const unchecked = content.match(UncheckedRegex) || []
    const checked = content.match(CheckedRegex) || []
    const total = unchecked.length + checked.length
    const completed = checked.length

    return {
      total,
      completed,
      isComplete: total === 0 || completed === total,
    }
  } catch {
    return { total: 0, completed: 0, isComplete: true }
  }
}

export function getPlanNameFromPath(planPath: string): string {
  const filename = basename(planPath)
  if ((CANONICAL_TRIO_FILES as readonly string[]).includes(filename)) {
    return basename(dirname(planPath))
  }
  return basename(planPath, ".md")
}

export function pauseWorkInFs(directory: string): boolean {
  const state = readWorkStateFromFs(directory)
  if (!state) {
    return false
  }

  state.paused = true
  return writeWorkStateToFs(directory, state)
}

export function resumeWorkInFs(directory: string): boolean {
  const state = readWorkStateFromFs(directory)
  if (!state) {
    return false
  }

  state.paused = false
  return writeWorkStateToFs(directory, state)
}

export function readSessionRuntimeFromFs(directory: string, sessionId: string): SessionRuntimeState | null {
  const filePath = getSessionRuntimeFilePath(directory, sessionId)
  try {
    if (!existsSync(filePath)) {
      return null
    }

    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    if (typeof parsed.session_id !== "string") {
      return null
    }
    if (parsed.session_id !== sessionId) {
      return null
    }
    if (typeof parsed.mode !== "string") {
      return null
    }
    if (typeof parsed.status !== "string") {
      return null
    }

    return parsed as SessionRuntimeState
  } catch {
    return null
  }
}

export function writeSessionRuntimeToFs(directory: string, state: SessionRuntimeState): boolean {
  try {
    const sessionDir = join(directory, SESSION_RUNTIME_DIR)
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true })
    }

    writeFileSync(getSessionRuntimeFilePath(directory, state.session_id), JSON.stringify(state, null, 2), "utf-8")
    return true
  } catch {
    return false
  }
}

export function clearSessionRuntimeFromFs(directory: string, sessionId: string): boolean {
  const filePath = getSessionRuntimeFilePath(directory, sessionId)
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
    return true
  } catch {
    return false
  }
}

function getSessionRuntimeFilePath(directory: string, sessionId: string): string {
  return join(directory, SESSION_RUNTIME_DIR, `${encodeSessionId(sessionId)}.json`)
}

function encodeSessionId(sessionId: string): string {
  return Buffer.from(sessionId, "utf-8").toString("base64url")
}
