import { defineCommand } from "citty";
import { runInteractiveFlow } from "../tui/flow.js";

export default defineCommand({
  meta: {
    name: "install",
    description: "Install agent skills",
  },
  async run() {
    await runInteractiveFlow();
  },
});
