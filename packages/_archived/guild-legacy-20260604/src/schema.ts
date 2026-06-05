/**
 * Zod schema definitions for @runecraft/guild config
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AgentVariantSchema = z.object({
  enabled: z.boolean(),
  model: z.string().optional(),
});

// V2: Skills discovery schema
export const SkillsConfigSchema = z
  .object({
    auto_discover: z.boolean().default(true),
    paths: z
      .object({
        global: z.string().default("~/.config/opencode/skills/"),
        legacy: z.string().default("~/.config/opencode/.agents/skills/"),
        project: z.string().default(".agents/skills/"),
      })
      .optional(),
  })
  .optional();

// V2: Custom agents schema
export const CustomAgentSchema = z.object({
  prompt_file: z.string().optional(),
  skills: z.array(z.string()).optional(),
  model: z.string().optional(),
});

export const CustomAgentsConfigSchema = z
  .record(z.string(), CustomAgentSchema)
  .optional();

// V2: Workflow schema
export const WorkflowStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent"),
    id: z.string(),
    agent: z.string(),
    mode: z.enum(["autonomous", "interactive"]).default("autonomous"),
    input: z.string().optional(),
    output: z.string().optional(),
    on_error: z.enum(["end", "continue"]).or(z.string()).default("end"),
  }),
  z.object({
    type: z.literal("gate"),
    id: z.string(),
    gate: z.string(),
    on_reject: z.enum(["end"]).or(z.string()).default("end"),
    on_approve: z.string().optional(),
  }),
]);

export const WorkflowSchema = z.object({
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema).min(1),
});

export const WorkflowsConfigSchema = z
  .record(z.string(), WorkflowSchema)
  .optional();

export const GuildConfigSchema = z.object({
  agents: z
    .record(
      z.union([
        z.literal("herald"),
        z.literal("scout"),
        z.literal("sage"),
        z.literal("forge"),
        z.literal("ward"),
        z.literal("arbiter"),
      ]),
      AgentVariantSchema
    )
    .optional(),
  graphify: z
    .object({
      enabled: z.boolean(),
      reportPath: z.string()
        .refine(v => !v.startsWith("..") && !v.startsWith("/"), {
          message: "reportPath must be a relative path without parent directory references"
        })
        .default("graphify-out/GRAPH_REPORT.md"),
    })
    .optional(),
  prompt: z
    .object({
      appendCoordination: z.boolean(),
      maxLength: z.number(),
    })
    .optional(),
  // V2 sections (all optional for backward compatibility)
  skills: SkillsConfigSchema,
  custom_agents: CustomAgentsConfigSchema,
  workflows: WorkflowsConfigSchema,
});

export type GuildConfig = z.infer<typeof GuildConfigSchema>;

/**
 * Generate JSON Schema for guild config (used at build time)
 * Returns a static schema for now due to zodToJsonSchema compatibility
 */
export function generateJsonSchema() {
  return {
    type: "object",
    properties: {
      agents: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            model: { type: "string" },
          },
          required: ["enabled"],
        },
      },
      graphify: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          reportPath: { type: "string" },
        },
      },
      prompt: {
        type: "object",
        properties: {
          appendCoordination: { type: "boolean" },
          maxLength: { type: "number" },
        },
      },
      skills: {
        type: "object",
        properties: {
          auto_discover: { type: "boolean" },
          paths: {
            type: "object",
            properties: {
              global: { type: "string" },
              legacy: { type: "string" },
              project: { type: "string" },
            },
          },
        },
      },
      custom_agents: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            prompt_file: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            model: { type: "string" },
          },
        },
      },
      workflows: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            description: { type: "string" },
            steps: { type: "array" },
          },
        },
      },
    },
  };
}
