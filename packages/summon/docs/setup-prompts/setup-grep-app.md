Goal: Install the grep.app code-search MCP server globally and expose it as a tool/MCP in OpenCode, so the agent can search literal code patterns across a million-plus public GitHub repositories for real-world usage examples.

Instructions:
1. Configure the grep.app MCP server (user-scope, global) using the hosted HTTP endpoint: https://mcp.grep.app
   No API key is required. Detect the OS and use the matching commands (e.g. an HTTP/remote transport entry).
2. Register the grep.app MCP server in the global OpenCode config (~/.config/opencode/opencode.json).
3. Print the configured endpoint and every config file changed.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by searching for one code pattern (e.g. `useState(`) and report the result.
