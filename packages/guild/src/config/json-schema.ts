import { join } from "path"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

import { GuildConfigSchema } from "./schema"
import { getKnownModels } from "../agents/model-resolution"

export type JsonSchemaObject = Record<string, unknown>

export const GUILD_CONFIG_JSON_SCHEMA_RELATIVE_PATH = "schema/guild-config.schema.json"
export const getGuildConfigJsonSchemaId = (version: string) =>
  `https://unpkg.com/@runecraft/guild@${version}/schema/guild-config.schema.json`
export const GUILD_CONFIG_JSON_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema"
export const GUILD_CONFIG_JSON_SCHEMA_TITLE = "Guild Config"
export const GUILD_CONFIG_JSON_SCHEMA_DESCRIPTION =
  "Configuration for the @runecraft/guild OpenCode plugin. Runtime loading accepts JSONC, while the generated schema artifact is plain JSON Schema."
export const GUILD_CONFIG_JSON_SCHEMA_VERSION_KEY = "x-guild-version"
export const GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME = "GuildConfig"
export const GUILD_CONFIG_JSON_SCHEMA_DEFINITION_PATH = "$defs"
export const GUILD_CONFIG_JSON_SCHEMA_REF_STRATEGY = "root"
export const GUILD_CONFIG_JSON_SCHEMA_ZOD_TO_JSON_SCHEMA_TARGET = "jsonSchema2019-09"
export const GUILD_CONFIG_JSON_SCHEMA_FALLBACK_TARGET = "draft-2020-12"
export const SAFE_RELATIVE_PATH_PATTERN =
  "^(?![\\\\/])(?![A-Za-z]:[\\\\/])(?!.*(?:^|[\\\\/])\\.\\.(?:[\\\\/]|$)).+$"
export const SAFE_RELATIVE_PATH_DESCRIPTION =
   "Relative directory path only. Absolute paths, leading backslashes/UNC paths, and '..' traversal segments are rejected at runtime."

export function getGuildConfigJsonSchemaMetadata(version: string) {
  return {
    $schema: GUILD_CONFIG_JSON_SCHEMA_DRAFT,
    $id: getGuildConfigJsonSchemaId(version),
    title: GUILD_CONFIG_JSON_SCHEMA_TITLE,
    description: GUILD_CONFIG_JSON_SCHEMA_DESCRIPTION,
    [GUILD_CONFIG_JSON_SCHEMA_VERSION_KEY]: version,
  }
}

export function getGuildConfigJsonSchemaArtifactPath(rootDir: string) {
  return join(rootDir, GUILD_CONFIG_JSON_SCHEMA_RELATIVE_PATH)
}

type GenerateGuildConfigJsonSchemaOptions = {
  version: string
}

function asObject(value: unknown): JsonSchemaObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonSchemaObject)
    : undefined
}

function resolveJsonSchemaRef(root: JsonSchemaObject, value: unknown): JsonSchemaObject | undefined {
  const schema = asObject(value)
  const ref = schema?.$ref
  if (typeof ref !== "string" || !ref.startsWith("#/$defs/")) return schema

  const segments = ref.slice(2).split("/")
  let current: unknown = root

  for (const segment of segments) {
    current = asObject(current)?.[segment]
  }

  return asObject(current)
}

function appendDescription(schema: JsonSchemaObject, description: string) {
  const existing = typeof schema.description === "string" ? schema.description : undefined
  schema.description = existing ? `${existing} ${description}` : description
}

function hasResolvedRootDefinition(schema: JsonSchemaObject) {
  const root = resolveJsonSchemaRef(schema, { $ref: `#/$defs/${GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME}` })
  return !!root && Object.keys(root).length > 0
}

function createWrappedNativeSchema() {
  const nativeSchema = asObject(
    z.toJSONSchema(GuildConfigSchema, {
      target: GUILD_CONFIG_JSON_SCHEMA_FALLBACK_TARGET,
      reused: "inline",
    }),
  )

  if (!nativeSchema) {
    throw new Error("Failed to generate a JSON Schema from GuildConfigSchema")
  }

  const { $schema: _ignoredDraft, ...rootSchema } = nativeSchema

  return {
    $ref: `#/$defs/${GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME}`,
    $defs: {
      [GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME]: rootSchema,
    },
  } satisfies JsonSchemaObject
}

function createBaseGuildConfigJsonSchema() {
  const legacySchema = zodToJsonSchema(
    GuildConfigSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
    {
      name: GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME,
      target: GUILD_CONFIG_JSON_SCHEMA_ZOD_TO_JSON_SCHEMA_TARGET,
      definitionPath: GUILD_CONFIG_JSON_SCHEMA_DEFINITION_PATH,
      $refStrategy: GUILD_CONFIG_JSON_SCHEMA_REF_STRATEGY,
    },
  ) as JsonSchemaObject

  return hasResolvedRootDefinition(legacySchema) ? legacySchema : createWrappedNativeSchema()
}

function annotateSafeRelativePathArray(root: JsonSchemaObject, value: unknown) {
  const schema = resolveJsonSchemaRef(root, value)
  const items = asObject(schema?.items)
  if (!items) return

  items.pattern = SAFE_RELATIVE_PATH_PATTERN
  appendDescription(items, SAFE_RELATIVE_PATH_DESCRIPTION)
}

function injectModelExamples(schema: JsonSchemaObject, knownModels: string[]) {
  const rootDefinition = resolveJsonSchemaRef(
    schema,
    { $ref: `#/$defs/${GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME}` },
  )
  const rootProps = asObject(rootDefinition?.properties)
  if (!rootProps) return

  const agentsSchema = resolveJsonSchemaRef(schema, rootProps.agents)
  const agentsAdditionalProps = asObject(agentsSchema?.additionalProperties)
  if (agentsAdditionalProps) {
    const agentProps = asObject(agentsAdditionalProps.properties)
    if (agentProps) {
      const modelSchema = asObject(agentProps.model)
      if (modelSchema?.type === "string") {
        modelSchema.examples = knownModels
      }
      const fallbackSchema = resolveJsonSchemaRef(schema, agentProps.fallback_models)
      const fallbackItems = asObject(fallbackSchema?.items)
      if (fallbackItems?.type === "string") {
        fallbackItems.examples = knownModels
      }
      const reviewSchema = resolveJsonSchemaRef(schema, agentProps.review_models)
      const reviewItems = asObject(reviewSchema?.items)
      if (reviewItems?.type === "string") {
        reviewItems.examples = knownModels
      }
    }
  }

  const customAgentsSchema = resolveJsonSchemaRef(schema, rootProps.custom_agents)
  const customAgentsAdditionalProps = asObject(customAgentsSchema?.additionalProperties)
  if (customAgentsAdditionalProps) {
    const customAgentProps = asObject(customAgentsAdditionalProps.properties)
    if (customAgentProps) {
      const modelSchema = asObject(customAgentProps.model)
      if (modelSchema?.type === "string") {
        modelSchema.examples = knownModels
      }
      const fallbackSchema = resolveJsonSchemaRef(schema, customAgentProps.fallback_models)
      const fallbackItems = asObject(fallbackSchema?.items)
      if (fallbackItems?.type === "string") {
        fallbackItems.examples = knownModels
      }
    }
  }

  const categoriesSchema = resolveJsonSchemaRef(schema, rootProps.categories)
  const categoriesAdditionalProps = asObject(categoriesSchema?.additionalProperties)
  if (categoriesAdditionalProps) {
    const categoryProps = asObject(categoriesAdditionalProps.properties)
    if (categoryProps) {
      const modelSchema = asObject(categoryProps.model)
      if (modelSchema?.type === "string") {
        modelSchema.examples = knownModels
      }
      const fallbackSchema = resolveJsonSchemaRef(schema, categoryProps.fallback_models)
      const fallbackItems = asObject(fallbackSchema?.items)
      if (fallbackItems?.type === "string") {
        fallbackItems.examples = knownModels
      }
    }
  }
}

function postProcessGuildConfigJsonSchema(schema: JsonSchemaObject) {
  const rootDefinition = resolveJsonSchemaRef(
    schema,
    { $ref: `#/$defs/${GUILD_CONFIG_JSON_SCHEMA_ROOT_NAME}` },
  )
  const properties = asObject(rootDefinition?.properties)
  if (!properties) return schema

  annotateSafeRelativePathArray(schema, properties.skill_directories)

  const workflows = resolveJsonSchemaRef(schema, properties.workflows)
  const workflowProperties = asObject(workflows?.properties)
  annotateSafeRelativePathArray(schema, workflowProperties?.directories)

  const knownModels = getKnownModels()
  injectModelExamples(schema, knownModels)

  return schema
}

export function generateGuildConfigJsonSchema({ version }: GenerateGuildConfigJsonSchemaOptions): JsonSchemaObject {
  const schema = createBaseGuildConfigJsonSchema()

  return postProcessGuildConfigJsonSchema({
    ...schema,
    ...getGuildConfigJsonSchemaMetadata(version),
  })
}

export function stringifyGuildConfigJsonSchema(schema: JsonSchemaObject) {
  return `${JSON.stringify(schema, null, 2)}\n`
}
