export type Platform = "linux" | "macos";

export type InstallStep =
  | { kind: "apt"; packages: string[] }
  | { kind: "brew"; packages: string[] }
  | { kind: "npm"; packages: string[]; global: boolean }
  | { kind: "pipx"; packages: string[]; ensurePipx: boolean }
  | { kind: "opencode-plugin"; package: string }
  | {
      kind: "opencode-mcp";
      name: string;
      transport: "remote" | "stdio";
      url?: string;
      command?: string[];
      envKey?: string;
      configPath: "global" | "local";
    }
  | { kind: "copy-template"; from: string; to: string; mode: "skip" | "append-marker" };

export type ToolScope = "global" | "local" | "both";

export interface Tool {
  name: string;
  title: string;
  description: string;
  scope: ToolScope;
  needsNode?: boolean;
  needsOpencode?: boolean;
  steps: Partial<Record<Platform, InstallStep[]>>;
}

export const TOOLS: Tool[] = [
  {
    name: "graphify",
    title: "Graphify",
    description: "Knowledge graph generator for the current repository",
    scope: "both",
    needsNode: true,
    steps: {
      linux: [
        { kind: "npm", packages: ["graphify"], global: true },
        {
          kind: "opencode-mcp",
          name: "graphify",
          transport: "stdio",
          command: ["graphify", "mcp"],
          configPath: "global",
        },
      ],
      macos: [
        { kind: "npm", packages: ["graphify"], global: true },
        {
          kind: "opencode-mcp",
          name: "graphify",
          transport: "stdio",
          command: ["graphify", "mcp"],
          configPath: "global",
        },
      ],
    },
  },
  {
    name: "markitdown",
    title: "Microsoft markitdown",
    description: "Convert PDFs and Office documents to Markdown",
    scope: "global",
    steps: {
      linux: [
        { kind: "apt", packages: ["pipx"] },
        { kind: "pipx", packages: ["markitdown"], ensurePipx: false },
      ],
      macos: [
        { kind: "brew", packages: ["pipx"] },
        { kind: "pipx", packages: ["markitdown"], ensurePipx: false },
      ],
    },
  },
  {
    name: "dcp",
    title: "OpenCode DCP plugin",
    description: "Auto-prune conversation context to reduce token usage",
    scope: "global",
    needsOpencode: true,
    steps: {
      linux: [
        { kind: "opencode-plugin", package: "@tarquinen/opencode-dcp@latest" },
      ],
      macos: [
        { kind: "opencode-plugin", package: "@tarquinen/opencode-dcp@latest" },
      ],
    },
  },
  {
    name: "context7",
    title: "Context7",
    description: "Upstash Context7 MCP for version-specific library docs",
    scope: "both",
    needsNode: true,
    steps: {
      linux: [
        {
          kind: "opencode-mcp",
          name: "context7",
          transport: "stdio",
          command: ["npx", "-y", "@upstash/context7-mcp"],
          envKey: "CONTEXT7_API_KEY",
          configPath: "global",
        },
      ],
      macos: [
        {
          kind: "opencode-mcp",
          name: "context7",
          transport: "stdio",
          command: ["npx", "-y", "@upstash/context7-mcp"],
          envKey: "CONTEXT7_API_KEY",
          configPath: "global",
        },
      ],
    },
  },
  {
    name: "exa",
    title: "Exa",
    description: "Exa web-search MCP server (remote endpoint)",
    scope: "both",
    steps: {
      linux: [
        {
          kind: "opencode-mcp",
          name: "exa",
          transport: "remote",
          url: "https://mcp.exa.ai/mcp",
          envKey: "EXA_API_KEY",
          configPath: "global",
        },
      ],
      macos: [
        {
          kind: "opencode-mcp",
          name: "exa",
          transport: "remote",
          url: "https://mcp.exa.ai/mcp",
          envKey: "EXA_API_KEY",
          configPath: "global",
        },
      ],
    },
  },
  {
    name: "grep-app",
    title: "grep.app",
    description: "grep.app code-search MCP server (remote HTTP)",
    scope: "both",
    steps: {
      linux: [
        {
          kind: "opencode-mcp",
          name: "grep-app",
          transport: "remote",
          url: "https://mcp.grep.app",
          configPath: "global",
        },
      ],
      macos: [
        {
          kind: "opencode-mcp",
          name: "grep-app",
          transport: "remote",
          url: "https://mcp.grep.app",
          configPath: "global",
        },
      ],
    },
  },
  {
    name: "agents-md",
    title: "AGENTS.md",
    description: "Bootstrap a repo-root AGENTS.md from the operating-principles template",
    scope: "local",
    steps: {
      linux: [
        {
          kind: "copy-template",
          from: "agents-template",
          to: "./AGENTS.md",
          mode: "append-marker",
        },
      ],
      macos: [
        {
          kind: "copy-template",
          from: "agents-template",
          to: "./AGENTS.md",
          mode: "append-marker",
        },
      ],
    },
  },
];

export function getTool(name: string): Tool | undefined {
  return TOOLS.find((t) => t.name === name);
}

export function stepsFor(tool: Tool, platform: Platform): InstallStep[] {
  return tool.steps[platform] ?? [];
}
