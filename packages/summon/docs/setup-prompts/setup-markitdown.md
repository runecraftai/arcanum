Goal: Install Microsoft markitdown globally and expose it as a tool/MCP in OpenCode, so the agent can read common document formats (Office files, PDFs).

Instructions:
1. Install markitdown globally (user-scope) following the latest instructions at: https://github.com/microsoft/markitdown
   Detect the OS and use the matching commands. Prefer `pipx` if available so the install is isolated and global.
2. Register markitdown (or its MCP server variant if provided upstream) in the global config of OpenCode (~/.config/opencode/opencode.json).
3. On any step failure, print the exact error plus proposed fix before retrying.
4. Print the installed version, install path, and config files changed.
5. Verify by converting one sample file of each: PDF, DOCX, XLSX, PPTX (skip the ones not available), and report the result.
