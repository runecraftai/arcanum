Goal: Install Graphify globally and initialize a knowledge graph for the current repository, so the agent has rich structural context.

Instructions:
1. If this is a git repository, append `**/graphify-out/` and `.graphify*` to `.gitignore` (create the file if missing). Skip lines that already exist.
2. Install Graphify globally (user-scope, not per-repo) following the latest instructions at: https://github.com/safishamsi/graphify
   Detect the OS and use the matching commands. On failure, surface the exact error and a proposed fix before retrying.
3. Register Graphify as an MCP/tool in:
   - OpenCode global config (~/.config/opencode/opencode.json)
   - Visual Studio GitHub Copilot
   - VS Code GitHub Copilot
   so it is always active when any of them is opened in this folder.
4. Initialize Graphify for the current repository and rebuild `graphify-out` from scratch.
5. Exclude vendor/build/minified noise (node_modules, bin, obj, dist, build, .next, .nuxt, *.min.*, packages, vendor). Add or update the Graphify ignore config accordingly.
6. Graphify has no hard size cap. If it prompts for a sub-folder to limit scope, process the entire filtered tree recursively without asking for confirmation. Only stop when the full filtered tree is processed and verified.

After completion, print:
- the number of indexed files / nodes / edges
- the Graphify version and install path
- every config file or ignore file that was changed
- how to query the graph from OpenCode and from Copilot.
