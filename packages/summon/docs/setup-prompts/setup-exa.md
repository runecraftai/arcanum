Goal: Install the Exa web-search MCP server globally and expose it as a tool/MCP in OpenCode, so the agent has fast, clean web search that returns ready-to-use content instead of raw result pages.

Instructions:
1. Configure the Exa MCP server (user-scope, global) following the latest instructions at: https://github.com/exa-labs/exa-mcp-server
   Prefer the hosted remote endpoint `https://mcp.exa.ai/mcp`. Detect the OS and use the matching commands.
   An Exa API key is required: get one from https://dashboard.exa.ai and store it in the global config under `environment.EXA_API_KEY` using `${EXA_API_KEY}`. Never hardcode the key in a committed file.
2. Register the Exa MCP server in the global OpenCode config (~/.config/opencode/opencode.json).
3. Print the configured endpoint, install or registration path, and every config file changed.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by running one web search and report the result.
