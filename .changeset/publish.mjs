#!/usr/bin/env node
/**
 * Custom publish script that uses bun publish instead of npm publish.
 * This ensures workspace:* dependencies are resolved to concrete versions.
 *
 * Called by changesets/action after versioning packages.
 * Replaces: changeset publish (which uses npm publish internally)
 * With: bun publish (which resolves workspace:* automatically)
 */

import { execSync } from "child_process";

try {
  console.log("Publishing packages with bun (workspace:* will be resolved)...");

  // bun publish from current directory (package dir set by changesets)
  // automatically resolves workspace:* to concrete versions
  execSync("bun publish", {
    stdio: "inherit",
  });

  console.log("✓ Published successfully with bun");
  process.exit(0);
} catch (error) {
  console.error("✗ Publish failed:", error.message || error);
  process.exit(1);
}
