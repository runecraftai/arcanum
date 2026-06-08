#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { spawnSync } from "bun";
import { CommitParser } from "conventional-commits-parser";
import { randomUUID } from "crypto";

interface ChangesetConfig {
  ignore: string[];
}

interface PackageInfo {
  name: string;
  dirName: string;
}

interface CommitParsed {
  hash: string;
  subject: string;
  body: string;
  type?: string;
  scope?: string;
  breakingChange?: boolean;
}

type BumpType = "major" | "minor" | "patch";

interface PackageChanges {
  packages: Set<string>;
  bump: BumpType;
  summaries: string[];
}

// Sanitize commit summary for YAML output
function sanitizeSummary(s: string): string {
  return s
    .trim()
    .split("\n")
    .filter((line) => line !== "---") // Remove YAML delimiters
    .join("\n")
    .replace(/\0/g, ""); // Remove null bytes
}

// Read .changeset/config.json for ignore list
function readChangesetConfig(): ChangesetConfig {
  try {
    const configPath = join(process.cwd(), ".changeset", "config.json");
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read .changeset/config.json:", error);
    process.exit(0);
  }
}

// Build package map from packages/*/package.json
function buildPackageMap(): Map<string, string> {
  const packageMap = new Map<string, string>();
  try {
    const packagesDir = join(process.cwd(), "packages");
    
    // Use readdirSync to list directories (native API, no shell)
    const dirs = readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const dirName of dirs) {
      const dirPath = join(packagesDir, dirName);
      
      // Read packages/<name>/package.json
      const pkgJsonPath = join(dirPath, "package.json");

      try {
        const pkgContent = readFileSync(pkgJsonPath, "utf-8");
        const pkg = JSON.parse(pkgContent);
        if (pkg.name) {
          packageMap.set(`packages/${dirName}`, pkg.name);
        }
      } catch {}
    }
  } catch (error) {
    // Silently ignore errors building package map
  }

  return packageMap;
}

// Find last release boundary
export function findLastReleaseRef(): string {
  try {
    let result = spawnSync(
      ["git", "describe", "--tags", "--abbrev=0", "--match", "@runecraft/*@*"],
      { cwd: process.cwd() }
    );

    if (result.success) {
      const tag = result.stdout.toString().trim();
      if (tag) {
        return tag;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // Fallback: use the most recent version commit
  try {
    const result = spawnSync(
      ["git", "log", "-n", "1", "--format=%H", "--grep=^chore: version packages"],
      { cwd: process.cwd() }
    );
    if (result.success) {
      const hash = result.stdout.toString().trim();
      if (hash) {
        return hash;
      }
    }
  } catch (error) {
    // Ignore
  }

  // Fallback: get first commit SHA
  try {
    const result = spawnSync(
      ["git", "rev-list", "--max-parents=0", "HEAD"],
      { cwd: process.cwd() }
    );
    if (result.success) {
      return result.stdout.toString().trim();
    }
  } catch (error) {
    // Ignore
  }

  return "HEAD";
}

// Get commits since reference
function getCommitsSinceRef(ref: string): CommitParsed[] {
  try {
    const result = spawnSync(
      ["git", "log", "--format=%H|||%s|||%b", `${ref}..HEAD`],
      { cwd: process.cwd() }
    );

    if (!result.success || !result.stdout.toString().trim()) {
      return [];
    }

    const output = result.stdout.toString().trim();
    if (!output) return [];

    const commits: CommitParsed[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split("|||");
      if (parts.length < 2) continue;

      const hash = parts[0];
      const subject = parts[1];
      const body = parts[2] || "";

      commits.push({
        hash,
        subject,
        body,
      });
    }

    return commits;
  } catch (error) {
    return [];
  }
}

// Parse conventional commit
function parseCommit(commit: CommitParsed): CommitParsed {
  try {
    // Parse using conventional-commits-parser
    const parser = new CommitParser();
    const fullMessage = commit.subject + "\n" + commit.body;
    const parsed = parser.parse(fullMessage);

    return {
      ...commit,
      type: parsed.type || undefined,
      scope: parsed.scope || undefined,
      breakingChange: commit.body.includes("BREAKING CHANGE:") || parsed.breaking,
    };
  } catch (error) {
    return commit;
  }
}

// Get affected packages for a commit
function getAffectedPackages(
  commitHash: string,
  packageMap: Map<string, string>
): string[] {
  try {
    const result = spawnSync(
      [
        "git",
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        commitHash,
      ],
      { cwd: process.cwd() }
    );

    if (!result.success) return [];

    const files = result.stdout.toString().trim().split("\n");
    const affected = new Set<string>();

    for (const file of files) {
      if (!file) continue;

      // Check which package this file belongs to
      for (const [dirPrefix, pkgName] of packageMap.entries()) {
        if (file.startsWith(dirPrefix + "/")) {
          affected.add(pkgName);
        }
      }
    }

    return Array.from(affected);
  } catch (error) {
    return [];
  }
}

// Determine bump type
function determineBumpType(parsed: CommitParsed): BumpType {
  // Major: breaking change
  if (parsed.breakingChange || parsed.subject.includes("!:")) {
    return "major";
  }

  // Minor: feat
  if (parsed.type === "feat") {
    return "minor";
  }

  // Patch: fix, perf, refactor
  if (["fix", "perf", "refactor"].includes(parsed.type || "")) {
    return "patch";
  }

  return "patch";
}

// Get packages that already have pending changesets
function getPendingChangesetPackages(): Set<string> {
  const pending = new Set<string>();
  try {
    const changesetDir = join(process.cwd(), ".changeset");
    const files = readdirSync(changesetDir, { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith(".md") && f.name !== "README.md")
      .map((f) => f.name);

    for (const file of files) {
      const filePath = join(changesetDir, file);
      const content = readFileSync(filePath, "utf-8");
      // Extract package names from YAML frontmatter: "package-name@version": bump
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        // Match lines like: "@runecraft/core": patch  or  "some-pkg": minor
        const pkgMatches = frontmatter.matchAll(/^"([^"]+)":/gm);
        for (const match of pkgMatches) {
          pending.add(match[1]);
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return pending;
}

// Main execution
function main() {
  // Skip if running on version bump commit or merge of version bump (prevents loop)
  try {
    // Check HEAD commit message
    const headMsgResult = spawnSync(
      ["git", "log", "-1", "--format=%s"],
      { cwd: process.cwd() }
    );
    if (headMsgResult.success) {
      const headMsg = headMsgResult.stdout.toString().trim();
      if (
        headMsg.startsWith("chore: version packages") ||
        headMsg.includes("changeset-release/")
      ) {
        console.log("⊘ Skipping: triggered by version bump or release branch merge");
        process.exit(0);
      }
    }
  } catch (error) {
    // Continue on error
  }

  const config = readChangesetConfig();
  const packageMap = buildPackageMap();

  // Warn if no packages found
  if (packageMap.size === 0) {
    console.warn(
      "⚠ No packages found in packageMap — check packages/ directory structure"
    );
  }

  // Find last release
  const lastRef = findLastReleaseRef();

  // Get commits
  const rawCommits = getCommitsSinceRef(lastRef);

  if (rawCommits.length === 0) {
    // No commits, exit cleanly
    process.exit(0);
  }

  // Parse and filter commits
  const commits = rawCommits
    .map(parseCommit)
    .filter(
      (c): c is CommitParsed => c.type !== undefined && c.type !== null
    )
    .filter((c) =>
      ["feat", "fix", "perf", "refactor"].includes(c.type || "")
    );

  if (commits.length === 0) {
    process.exit(0);
  }

  // Aggregate by package
  const changesByPackage = new Map<string, PackageChanges>();

  for (const commit of commits) {
    const affected = getAffectedPackages(commit.hash, packageMap);
    const bump = determineBumpType(commit);
    const summary = sanitizeSummary(commit.subject);

    for (const pkgName of affected) {
      // Skip ignored packages
      if (config.ignore.includes(pkgName)) {
        continue;
      }

      if (!changesByPackage.has(pkgName)) {
        changesByPackage.set(pkgName, {
          packages: new Set([pkgName]),
          bump,
          summaries: [],
        });
      }

      const change = changesByPackage.get(pkgName)!;
      change.summaries.push(summary);

      // Upgrade bump if needed
      if (
        bump === "major" ||
        (change.bump === "minor" && bump === "major") ||
        (change.bump === "patch" && bump !== "patch")
      ) {
        change.bump = bump;
      }
    }
  }

  // Get packages with pending changesets to avoid duplicates
  const pendingPackages = getPendingChangesetPackages();

  // Write changeset files
  if (changesByPackage.size > 0) {
    for (const [pkgName, changes] of changesByPackage) {
      // Skip packages that already have a pending changeset
      if (pendingPackages.has(pkgName)) {
        continue;
      }

      const id = randomUUID().slice(0, 8);
      const filename = join(process.cwd(), ".changeset", `${id}.md`);

      let content = "---\n";
      for (const pkg of changes.packages) {
        content += `"${pkg}": ${changes.bump}\n`;
      }
      content += "---\n\n";
      content += changes.summaries.join("\n") + "\n";

      writeFileSync(filename, content);
    }
  }

  process.exit(0);
}

if (import.meta.main) {
  main();
}
