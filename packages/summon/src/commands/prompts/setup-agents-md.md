Goal: Bootstrap a repo-root AGENTS.md so any agent (OpenCode, Claude Code, GitHub Copilot, etc.) reads the same operating principles and project context.

Instructions:
1. Locate the agent template at: prompts/agents-template.md (relative to this command's package; the runtime resolves the full path).
2. If `AGENTS.md` does not exist at the repository root, copy the template to `./AGENTS.md`.
3. If `AGENTS.md` already exists, do NOT overwrite it. Instead, append a clearly separated section titled `<!-- BEGIN arcanum:agents-md -->` followed by a single-line note pointing to the template (`Source: <resolved template path>`), and close with `<!-- END arcanum:agents-md -->`. This makes the addition reversible.
4. Walk through the template's "Project Context" section and ask the user to fill in:
   - What This Project Is
   - Architecture
   - Conventions
   - Verification
   Do not invent answers. Skip any sub-section the user does not know yet.
5. Recommend the user commit the resulting `AGENTS.md` so the team shares the same knowledge base.
6. Print the resolved template path, the final path of the created or amended `AGENTS.md`, and the list of sections that were filled vs left as comments.
