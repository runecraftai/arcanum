/** Root directory for Guild state and plans */
export const GUILD_DIR = ".guild"

/** Work state file name */
export const WORK_STATE_FILE = "state.json"

/** Full relative path to work state */
export const WORK_STATE_PATH = `${GUILD_DIR}/${WORK_STATE_FILE}`

/** Directory containing runtime execution/session state */
export const RUNTIME_DIR = `${GUILD_DIR}/runtime`

/** Repo-scoped execution lease file */
export const ACTIVE_EXECUTION_FILE = "active-execution.json"

/** Full relative path to active execution lease */
export const ACTIVE_EXECUTION_PATH = `${RUNTIME_DIR}/${ACTIVE_EXECUTION_FILE}`

/** Directory containing per-session runtime records */
export const SESSION_RUNTIME_DIR = `${RUNTIME_DIR}/sessions`

/** Directory where plan files are stored */
export const PLANS_DIR = `${GUILD_DIR}/plans`
