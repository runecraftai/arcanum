Goal: Install Graphify globally and initialize a knowledge graph for the current repository, so the agent has rich structural context.

Instructions:
1. If this is a git repository, append `**/graphify-out/` and `.graphify*` to `.gitignore` (create the file if missing). Skip lines that already exist.
2. Install Graphify globally (user-scope, not per-repo) following the latest instructions at:
   https://github.com/Graphify-Labs/graphify
   Detect the OS and use the matching commands (uv, pipx, or pip). On failure, surface the exact error and a proposed fix before retrying.
3. Register the Graphify skill with my AI coding assistant:
   - Since I'm using OpenCode, run: `graphify opencode install`
   - For other agents, check the platform table at:
     https://github.com/Graphify-Labs/graphify#make-your-assistant-always-use-the-graph
     and run the matching `graphify <platform> install` command
4. Initialize Graphify for the current repository and rebuild `graphify-out` from scratch using `/graphify .` (or `graphify .` on Windows/PowerShell).
5. Exclude vendor/build/minified noise (node_modules, bin, obj, dist, build, .next, .nuxt, *.min.*, packages, vendor). Add or update the Graphify ignore config accordingly.
6. Graphify has no hard size cap. If it prompts for a sub-folder to limit scope, process the entire filtered tree recursively without asking for confirmation. Only stop when the full filtered tree is processed and verified.

After completion, print:
- the number of indexed files / nodes / edges
- the Graphify version and install path
- every config file or ignore file that was changed
- how to query the graph from my agent (e.g. `graphify query "<question>"`, `graphify path <A> <B>`, `graphify explain <concept>`).
