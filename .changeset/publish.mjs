#!/usr/bin/env node
/**
 * Custom publish script that publishes each workspace package directly.
 *
 * Called by changesets/action after versioning packages.
 * Replaces: changeset publish so we can control which workspaces publish.
 *
 * This script:
 * 1. Iterates over each package in packages/
 * 2. Skips private packages and ignored packages (from changesets config)
 * 3. Runs npm publish from each package's directory
 */

import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

try {
  console.log("Publishing packages with npm...");

  // Read changesets config to get ignored packages
  const configPath = join(process.cwd(), ".changeset", "config.json");
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const ignoredPackages = new Set(config.ignore || []);

  // Find all packages in packages/ directory
  const packagesDir = join(process.cwd(), "packages");
  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let publishedCount = 0;
  let skippedCount = 0;

  for (const pkgName of packageDirs) {
    const pkgDir = join(packagesDir, pkgName);
    const pkgJsonPath = join(pkgDir, "package.json");

    // Check if package.json exists
    let pkgJson;
    try {
      pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`⊘ Skipping ${pkgName} (no package.json found)`);
        skippedCount++;
        continue;
      }
      throw error;
    }

    // Skip private packages
    if (pkgJson.private) {
      console.log(`⊘ Skipping private package: ${pkgJson.name}`);
      skippedCount++;
      continue;
    }

    // Skip ignored packages
    if (ignoredPackages.has(pkgJson.name)) {
      console.log(`⊘ Skipping ignored package: ${pkgJson.name}`);
      skippedCount++;
      continue;
    }

    try {
      // Check if version already exists on npm
      const versionCheckCmd = `npm view ${pkgJson.name}@${pkgJson.version} version`;
      let versionExists = false;
      try {
        execSync(versionCheckCmd, { stdio: "pipe" });
        versionExists = true;
      } catch (e) {
        // npm view throws if version doesn't exist, that's expected
        versionExists = false;
      }

      if (versionExists) {
        console.log(
          `⊘ Skipping ${pkgJson.name}@${pkgJson.version} (already published on npm)`
        );
        skippedCount++;
        continue;
      }

      console.log(`\n→ Publishing ${pkgJson.name} from ${pkgDir}`);
      execSync("npm publish", {
        stdio: "inherit",
        cwd: pkgDir,
      });

      publishedCount++;
    } catch (error) {
      console.error(
        `✗ Failed to publish ${pkgJson.name}:`,
        error.message || error
      );
      process.exit(1);
    }
  }

  console.log(
    `\n✓ Published successfully with npm (${publishedCount} packages, ${skippedCount} skipped)`
  );
  process.exit(0);
} catch (error) {
  console.error("✗ Publish failed:", error.message || error);
  process.exit(1);
}
