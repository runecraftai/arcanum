Goal: Install Upstash Context7 globally and expose it as a tool/MCP in OpenCode, so the agent can fetch current, version-specific documentation and code examples for any library on demand.

Instructions:
1. Install the Context7 MCP server globally (user-scope) following the latest instructions at: https://github.com/upstash/context7
   Detect the OS and use the matching commands. Requires Node.js >= v18.
   If an API key is needed, get one from https://context7.com/dashboard and store it in the global config under `environment.CONTEXT7_API_KEY` using `${CONTEXT7_API_KEY}`. Never hardcode the key in a committed file.
2. Register the Context7 MCP server in the global OpenCode config (~/.config/opencode/opencode.json).
3. Print the installed version, install path, and config files changed.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by resolving one library and fetching its docs (e.g. "Next.js routing"), and report the result.
