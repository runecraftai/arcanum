import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "bun";

const SCRIPT_PATH = join(import.meta.dir, "generate-from-commits.ts");

function run(command: string[], cwd: string) {
  const result = spawnSync(command, { cwd });

  if (!result.success) {
    throw new Error(
      [
        `Command failed: ${command.join(" ")}`,
        result.stdout.toString(),
        result.stderr.toString(),
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return result;
}

function runAndReadStdout(command: string[], cwd: string) {
  const result = spawnSync(command, { cwd });

  if (!result.success) {
    throw new Error(
      [
        `Command failed: ${command.join(" ")}`,
        result.stdout.toString(),
        result.stderr.toString(),
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return result.stdout.toString().trim();
}

function readLastReleaseRef(repoDir: string) {
  const checker = join(repoDir, "check-release-ref.ts");
  writeFileSync(
    checker,
    `import { findLastReleaseRef } from ${JSON.stringify(SCRIPT_PATH)};\nconsole.log(findLastReleaseRef());\n`
  );

  return runAndReadStdout([process.execPath, checker], repoDir);
}

describe("generate-from-commits", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("generates a changeset when a normal commit follows a version bump commit", () => {
    const repoDir = mkdtempSync(join(tmpdir(), "changeset-generator-"));
    tempDirs.push(repoDir);

    mkdirSync(join(repoDir, ".changeset"), { recursive: true });
    mkdirSync(join(repoDir, "packages", "spells"), { recursive: true });

    writeFileSync(join(repoDir, ".changeset", "config.json"), JSON.stringify({ ignore: [] }));
    writeFileSync(
      join(repoDir, "packages", "spells", "package.json"),
      JSON.stringify({ name: "@runecraft/spells", version: "0.1.0" }, null, 2) + "\n"
    );
    writeFileSync(join(repoDir, "packages", "spells", "index.ts"), "export const spell = 'spark'\n");

    run(["git", "init"], repoDir);
    run(["git", "config", "user.name", "Test User"], repoDir);
    run(["git", "config", "user.email", "test@example.com"], repoDir);

    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "chore: initial commit"], repoDir);

    writeFileSync(
      join(repoDir, "packages", "spells", "package.json"),
      JSON.stringify({ name: "@runecraft/spells", version: "0.1.1" }, null, 2) + "\n"
    );
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "chore: version packages"], repoDir);

    writeFileSync(join(repoDir, "packages", "spells", "index.ts"), "export const spell = 'nova'\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "fix: keep post-release commits flowing"], repoDir);

    run([process.execPath, SCRIPT_PATH], repoDir);

    const changesets = readdirSync(join(repoDir, ".changeset")).filter(
      (file) => file.endsWith(".md") && file !== "README.md"
    );

    expect(changesets).toHaveLength(1);

    const content = readFileSync(join(repoDir, ".changeset", changesets[0]), "utf-8");
    expect(content).toContain('"@runecraft/spells": patch');
    expect(content).toContain("fix: keep post-release commits flowing");
  });

  it("uses the nearest reachable release tag instead of the highest semver tag", () => {
    const repoDir = mkdtempSync(join(tmpdir(), "changeset-generator-"));
    tempDirs.push(repoDir);

    run(["git", "init"], repoDir);
    run(["git", "config", "user.name", "Test User"], repoDir);
    run(["git", "config", "user.email", "test@example.com"], repoDir);

    writeFileSync(join(repoDir, "file.txt"), "one\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "chore: init"], repoDir);
    run(["git", "tag", "@runecraft/guild@2.0.0"], repoDir);

    writeFileSync(join(repoDir, "file.txt"), "two\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "fix: later release boundary"], repoDir);
    run(["git", "tag", "@runecraft/guild@1.0.0"], repoDir);

    expect(readLastReleaseRef(repoDir)).toBe("@runecraft/guild@1.0.0");
  });

  it("falls back to the latest version commit when tags are missing", () => {
    const repoDir = mkdtempSync(join(tmpdir(), "changeset-generator-"));
    tempDirs.push(repoDir);

    run(["git", "init"], repoDir);
    run(["git", "config", "user.name", "Test User"], repoDir);
    run(["git", "config", "user.email", "test@example.com"], repoDir);

    writeFileSync(join(repoDir, "file.txt"), "one\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "chore: init"], repoDir);

    writeFileSync(join(repoDir, "file.txt"), "two\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "chore: version packages"], repoDir);
    const versionCommit = runAndReadStdout(["git", "rev-parse", "HEAD"], repoDir);

    writeFileSync(join(repoDir, "file.txt"), "three\n");
    run(["git", "add", "."], repoDir);
    run(["git", "commit", "-m", "fix: after version boundary"], repoDir);

    expect(readLastReleaseRef(repoDir)).toBe(versionCommit);
  });
});
