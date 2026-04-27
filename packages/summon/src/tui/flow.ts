import path from "node:path";
import * as clack from "@clack/prompts";
import { showBanner } from "./banner.js";
import { selectAgents } from "./agent-select.js";
import { selectAction } from "./action-menu.js";
import { browseSkills } from "./skill-browse.js";
import { selectMethod } from "./method-select.js";
import { selectScope } from "./scope-select.js";
import { showConfirmation } from "./confirmation.js";
import { showProgress, withSpinner } from "./progress.js";
import { detectAgents } from "../agents/detector.js";
import { AGENTS } from "../agents/registry.js";
import { loadSkillCatalog } from "../skills/loader.js";
import {
  discoverInstalledSkills,
  getInstalledSkillNames,
  filterSkillsByInstallStatus,
} from "../skills/discovery.js";
import { installSkill, updateSkill, removeSkill } from "../skills/installer.js";
import { resolveSpellsDir } from "../utils/paths.js";
import type { InstallResult } from "../skills/installer.js";
import type { SkillMeta } from "../skills/loader.js";
import type { DetectedAgent } from "../agents/detector.js";

interface FlowState {
  step: number;
  selectedAgentIds?: string[];
  selectedAgents: DetectedAgent[];
  action?: string;
  allSkills: SkillMeta[];
  installedNames: string[];
  filteredSkills: SkillMeta[];
  selectedSkillNames?: string[];
  selectedSkills: SkillMeta[];
  method?: string;
  scope?: string;
  spellsDir: string;
  detected: DetectedAgent[];
}

async function stepSelectAgent(state: FlowState): Promise<FlowState> {
  const result = await selectAgents(state.detected);
  if (clack.isCancel(result)) {
    clack.outro("Cancelled.");
    throw new Error("USER_CANCEL");
  }
  const selectedAgentIds = result as string[];
  return {
    ...state,
    step: 2,
    selectedAgentIds,
    selectedAgents: state.detected.filter((a) => selectedAgentIds.includes(a.id)),
  };
}

async function stepSelectAction(state: FlowState): Promise<FlowState> {
  const result = await selectAction();
  if (clack.isCancel(result)) {
    return { ...state, step: 1 };
  }
  return {
    ...state,
    step: 3,
    action: result,
  };
}

async function stepBrowseSkills(state: FlowState): Promise<FlowState> {
  const spinner = clack.spinner();
  spinner.start("Loading skills...");
  const allSkills = await loadSkillCatalog(state.spellsDir);
  const installedNames = await getInstalledSkillNames(state.selectedAgents);
  spinner.stop("Skills loaded");

  const filteredSkills = filterSkillsByInstallStatus(
    allSkills,
    installedNames,
    state.action as "install" | "update" | "remove"
  );

  const result = await browseSkills(
    filteredSkills,
    state.action as "install" | "update" | "remove",
    installedNames
  );

  if (clack.isCancel(result)) {
    return { ...state, step: 2 };
  }
  if (!Array.isArray(result) || result.length === 0) {
    clack.outro("Nothing to do.");
    throw new Error("USER_CANCEL");
  }

  const selectedSkillNames = result;
  const selectedSkills = filteredSkills.filter((s) =>
    selectedSkillNames.includes(s.name)
  );

  return {
    ...state,
    step: state.action === "install" ? 4 : 6,
    allSkills,
    installedNames,
    filteredSkills,
    selectedSkillNames,
    selectedSkills,
  };
}

async function stepSelectMethod(state: FlowState): Promise<FlowState> {
  const result = await selectMethod();
  if (clack.isCancel(result)) {
    return { ...state, step: 3 };
  }
  const method = result;
  const nextStep = method === "symlink" ? 6 : 5;
  const scope = method === "symlink" ? "local" : state.scope;

  return {
    ...state,
    step: nextStep,
    method,
    scope,
  };
}

async function stepSelectScope(state: FlowState): Promise<FlowState> {
  const result = await selectScope();
  if (clack.isCancel(result)) {
    return { ...state, step: 4 };
  }
  return {
    ...state,
    step: 6,
    scope: result as string,
  };
}

async function stepConfirm(state: FlowState): Promise<FlowState> {
  const result = await showConfirmation({
    agents: state.selectedAgents.map((a) => a.name),
    skills: state.selectedSkills.map((s) => s.name),
    action: state.action as string,
    method: state.method,
    scope: state.scope,
  });

  if (clack.isCancel(result) || result === "back") {
    const step =
      state.action === "install" && state.method === "copy"
        ? 5
        : state.action === "install"
          ? 4
          : 3;
    return { ...state, step };
  }
  if (result === "cancel") {
    clack.outro("Aborted.");
    throw new Error("USER_CANCEL");
  }

  return { ...state, step: 7 };
}

async function executeInstall(
  skill: SkillMeta,
  agent: DetectedAgent,
  state: FlowState
): Promise<InstallResult> {
  const skillSourcePath = path.join(state.spellsDir, skill.name, "SKILL.md");
  return await installSkill(
    skill,
    skillSourcePath,
    agent.installDir,
    state.method as "copy" | "symlink",
    agent.id,
    process.cwd()
  );
}

async function executeUpdate(
  skill: SkillMeta,
  agent: DetectedAgent,
  installed: InstalledSkill[],
  state: FlowState
): Promise<InstallResult | null> {
  const installedSkill = installed.find(
    (s) => s.skillName === skill.name && s.agentId === agent.id
  );
  if (!installedSkill) return null;

  const skillSourcePath = path.join(state.spellsDir, skill.name, "SKILL.md");
  return await updateSkill(
    skill,
    skillSourcePath,
    installedSkill.filePath,
    installedSkill.method,
    installedSkill.agentId,
    process.cwd()
  );
}

async function executeRemove(
  skill: SkillMeta,
  agent: DetectedAgent,
  installed: InstalledSkill[],
  state: FlowState
): Promise<InstallResult | null> {
  const installedSkill = installed.find(
    (s) => s.skillName === skill.name && s.agentId === agent.id
  );
  if (!installedSkill) return null;

  return await removeSkill(
    installedSkill.skillName,
    installedSkill.filePath,
    installedSkill.agentId,
    process.cwd()
  );
}

type ActionExecutor = (
  skill: SkillMeta,
  agent: DetectedAgent,
  installed: InstalledSkill[],
  state: FlowState
) => Promise<InstallResult | null>;

interface InstalledSkill {
  skillName: string;
  agentId: string;
  filePath: string;
  method: "copy" | "symlink";
}

const actionExecutors: Record<string, ActionExecutor> = {
  install: async (skill, agent, _installed, state) =>
    executeInstall(skill, agent, state),
  update: executeUpdate,
  remove: executeRemove,
};

async function stepExecute(state: FlowState): Promise<FlowState> {
  const results: InstallResult[] = [];
  const installed: InstalledSkill[] =
    state.action === "update" || state.action === "remove"
      ? await discoverInstalledSkills()
      : [];

  const executor = actionExecutors[state.action || ""] as ActionExecutor;

  for (const agent of state.selectedAgents) {
    for (const skill of state.selectedSkills) {
      try {
        let res: InstallResult | null;
        if (state.action === "install") {
          res = await executor(skill, agent, installed, state);
        } else {
          res = await executor(skill, agent, installed as never, state);
        }
         if (res) results.push(res);
       } catch (err) {
         results.push({
           skillName: skill.name,
           agentId: agent.id,
           success: false,
           method: (state.method as "copy" | "symlink") || "copy",
           error:
             err instanceof Error ? err.message : String(err || "Unknown error"),
         });
       }
    }
  }

  await showProgress(results);
  clack.outro("Done!");
  throw new Error("COMPLETE");
}

const stepHandlers: Record<number, (state: FlowState) => Promise<FlowState>> = {
  1: stepSelectAgent,
  2: stepSelectAction,
  3: stepBrowseSkills,
  4: stepSelectMethod,
  5: stepSelectScope,
  6: stepConfirm,
  7: stepExecute,
};

export async function runInteractiveFlow(): Promise<void> {
  showBanner();

  const spinner = clack.spinner();
  spinner.start("Detecting agents...");
  const detected = await detectAgents();
  const detectedCount = detected.filter((a) => a.detected).length;
  spinner.stop(
    `${detectedCount} agent${detectedCount !== 1 ? "s" : ""} detected`
  );

  const spellsDir = await resolveSpellsDir();

  let state: FlowState = {
    step: 1,
    selectedAgents: [],
    allSkills: [],
    installedNames: [],
    filteredSkills: [],
    selectedSkills: [],
    spellsDir,
    detected,
  };

  while (true) {
    try {
      const handler = stepHandlers[state.step];
      if (!handler) {
        throw new Error(`Unknown step: ${state.step}`);
      }
      state = await handler(state);
    } catch (err) {
      if (err instanceof Error && err.message === "COMPLETE") {
        return;
      }
      if (err instanceof Error && err.message === "USER_CANCEL") {
        return;
      }
      throw err;
    }
  }
}
