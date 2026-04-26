import fs from "node:fs/promises";
import path from "node:path";

export interface SkillMeta {
  name: string;
  description: string;
  category: string;
  version: string;
  tags: string[];
  filePath: string;
}

/**
 * Sanitize skill name to prevent path traversal attacks
 * Accepts only alphanumeric, hyphens, and underscores
 */
export function sanitizeSkillName(name: string): string | null {
  if (!name) return null;
  // Strip directory components
  const basename = path.basename(name);
  // Validate pattern: starts with alphanumeric, contains only alphanumeric, hyphens, underscores
  if (/^[a-z0-9][a-z0-9-_]*$/i.test(basename)) {
    return basename;
  }
  return null;
}

/**
 * Parse YAML frontmatter from markdown string
 * Format: ---\nkey: value\nkey: [val1, val2]\n---
 */
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const lines = content.split("\n");

  // Find first and second --- delimiters
  let firstDelim = -1;
  let secondDelim = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (firstDelim === -1) {
        firstDelim = i;
      } else {
        secondDelim = i;
        break;
      }
    }
  }

  if (firstDelim === -1 || secondDelim === -1 || firstDelim !== 0) {
    return null;
  }

  const frontmatterLines = lines.slice(firstDelim + 1, secondDelim);
  const metadata: Record<string, unknown> = {};

  for (const line of frontmatterLines) {
    if (!line.trim()) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.substring(0, colonIdx).trim();
    const rawValue = line.substring(colonIdx + 1).trim();

    // Parse value: handle arrays [val1, val2] and strings
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const arrayContent = rawValue
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim());
      metadata[key] = arrayContent;
    } else {
      // Remove quotes if present
      const value = rawValue.replace(/^["']|["']$/g, "");
      metadata[key] = value;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

/**
 * Load skill catalog from spells directory
 * Reads all {skillName}/SKILL.md files and extracts frontmatter metadata
 */
export async function loadSkillCatalog(spellsDir: string): Promise<SkillMeta[]> {
  const catalog: SkillMeta[] = [];

  try {
    const skillDirs = await fs.readdir(spellsDir);

    for (const skillDir of skillDirs) {
      const skillPath = path.join(spellsDir, skillDir, "SKILL.md");

      try {
        const content = await fs.readFile(skillPath, "utf-8");
        const metadata = parseFrontmatter(content);

        if (metadata) {
          const rawName = String(metadata.name || skillDir);
          const sanitizedName = sanitizeSkillName(rawName);
          
          if (!sanitizedName) {
            console.warn(`Warning: Skill name "${rawName}" failed validation at ${skillPath} — skipping`);
            continue;
          }
          
          const skillMeta: SkillMeta = {
            name: sanitizedName,
            description: String(metadata.description || ""),
            category: String(metadata.category || "Uncategorized"),
            version: String(metadata.version || "1.0.0"),
            tags: Array.isArray(metadata.tags)
              ? metadata.tags.map(String)
              : [],
            filePath: path.resolve(skillPath),
          };
          catalog.push(skillMeta);
        }
      } catch (err) {
        // Skip skills with missing or malformed frontmatter
        console.warn(`Warning: Could not load skill at ${skillPath}`);
      }
    }
  } catch (err) {
    throw new Error(
      `Failed to load skill catalog from ${spellsDir}: ${String(err)}`
    );
  }

  return catalog;
}
