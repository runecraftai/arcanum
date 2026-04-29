/**
 * Zod schema definitions for @runecraft/guild config
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AgentVariantSchema = z.object({
  enabled: z.boolean(),
  model: z.string().optional(),
});

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
    },
  };
}
