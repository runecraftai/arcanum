#!/usr/bin/env bun

/**
 * Generate JSON Schema for guild config
 * Run: bun run scripts/generate-schema.ts
 */

import { promises as fs } from "fs";
import { join } from "path";
import { generateJsonSchema } from "../src/schema.ts";

async function main() {
  const schema = generateJsonSchema();
  const schemaWithMetadata = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://runecraft.io/schemas/guild-config.json",
    ...schema,
  };

  const distDir = join(import.meta.dirname, "../dist");
  const schemaPath = join(distDir, "schema.json");

  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(schemaPath, JSON.stringify(schemaWithMetadata, null, 2));

  console.log(`✓ Generated schema at ${schemaPath}`);
}

main().catch((err) => {
  console.error("Failed to generate schema:", err);
  process.exit(1);
});
