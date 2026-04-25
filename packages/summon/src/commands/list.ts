import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import { discoverInstalledSkills } from "../skills/discovery";
import { detectAgents } from "../agents/detector";

export default defineCommand({
  meta: {
    name: "list",
    description: "List installed agent skills",
  },
  async run() {
    try {
      const installed = await discoverInstalledSkills();
      const detected = await detectAgents();

      if (installed.length === 0) {
        clack.log.info("No skills installed.");
        return;
      }

      clack.log.info("");
      clack.log.info("Installed Skills:");
      clack.log.info("");

      // Group by agent
      const byAgent: Record<string, typeof installed> = {};
      for (const skill of installed) {
        if (!byAgent[skill.agentId]) {
          byAgent[skill.agentId] = [];
        }
        byAgent[skill.agentId].push(skill);
      }

      for (const agentId of Object.keys(byAgent).sort()) {
        const agent = detected.find((a) => a.id === agentId);
        const agentName = agent?.name || agentId;

        clack.log.info(`  ${agentName}:`);

        for (const skill of byAgent[agentId]) {
          const methodLabel = skill.method === "symlink" ? "→" : "•";
          clack.log.info(`    ${methodLabel} ${skill.skillName}`);
          clack.log.info(`      ${skill.filePath}`);
        }

        clack.log.info("");
      }
    } catch (error) {
      clack.log.error(`Error: ${String(error)}`);
    }
  },
});
