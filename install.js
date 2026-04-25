#!/usr/bin/env node

/**
 * install.js - OpenCode Skill Installer
 *
 * Usage:
 *   node install.js              # Install spec-driven meta-skill only
 *   node install.js --all        # Install all skills
 *   node install.js --skill <name>  # Install specific skill
 *
 * Target directory: ~/.config/opencode/skills/<skill-name>/
 */

const fs = require('fs');
const path = require('path');

const cpSync = fs.cpSync || (function() {
  // Fallback for Node.js < 16.7
  const cp = require('child_process').spawnSync;
  return (src, dest, opts) => {
    const result = cp('cp', ['-r', src, dest], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`Failed to copy ${src}`);
  };
})();

// Parse command-line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'default';
const skillName = args[1];

// Get home directory
const homeDir = process.env.HOME || process.env.USERPROFILE;
if (!homeDir) {
  console.error('ERROR: Could not determine home directory');
  process.exit(1);
}

const skillsBaseDir = path.join(homeDir, '.config', 'opencode', 'skills');

// Ensure target directory exists
if (!fs.existsSync(path.dirname(skillsBaseDir))) {
  fs.mkdirSync(path.dirname(skillsBaseDir), { recursive: true });
}

/**
 * Find all skills in the skills/ directory
 */
function findSkills() {
  const skillsDir = path.join(__dirname, 'skills');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('ERROR: skills/ directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const skillPath = path.join(skillsDir, entry.name);
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    
    if (fs.existsSync(skillMdPath)) {
      skills.push(entry.name);
    }
  }

  return skills.sort();
}

/**
 * Install a single skill
 */
function installSkill(skillName) {
  const sourcePath = path.join(__dirname, 'skills', skillName);
  const targetPath = path.join(skillsBaseDir, skillName);

  // Verify source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`ERROR: Skill '${skillName}' not found in skills/ directory`);
    process.exit(1);
  }

  // Verify SKILL.md exists
  const skillMdPath = path.join(sourcePath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    console.error(`ERROR: Skill '${skillName}' is missing SKILL.md`);
    process.exit(1);
  }

  // Remove existing installation if present
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }

  // Copy skill
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`✓ Installed: ${skillName} → ${targetPath}`);
  } catch (error) {
    console.error(`ERROR: Failed to install ${skillName}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  const allSkills = findSkills();

  if (allSkills.length === 0) {
    console.error('ERROR: No skills found in skills/ directory');
    process.exit(1);
  }

  let skillsToInstall = [];

  if (mode === 'default' || mode.startsWith('--')) {
    // Default mode: install spec-driven only
    if (mode === '--all') {
      // --all: install all skills
      skillsToInstall = allSkills;
      console.log(`Installing all ${allSkills.length} skills...`);
    } else if (mode === '--skill' && skillName) {
      // --skill <name>: install specific skill
      if (!allSkills.includes(skillName)) {
        console.error(`ERROR: Skill '${skillName}' not found. Available skills: ${allSkills.join(', ')}`);
        process.exit(1);
      }
      skillsToInstall = [skillName];
      console.log(`Installing skill: ${skillName}`);
    } else if (mode === 'default' || !mode.startsWith('-')) {
      // Default: spec-driven only
      if (!allSkills.includes('spec-driven')) {
        console.error('ERROR: spec-driven skill not found');
        process.exit(1);
      }
      skillsToInstall = ['spec-driven'];
      console.log('Installing spec-driven meta-skill (default)...');
    } else {
      console.error('Usage:');
      console.error('  node install.js              # Install spec-driven only');
      console.error('  node install.js --all        # Install all skills');
      console.error(`  node install.js --skill <name>  # Install specific skill`);
      console.error(`\nAvailable skills: ${allSkills.join(', ')}`);
      process.exit(1);
    }
  } else {
    console.error('Usage:');
    console.error('  node install.js              # Install spec-driven only');
    console.error('  node install.js --all        # Install all skills');
    console.error(`  node install.js --skill <name>  # Install specific skill`);
    process.exit(1);
  }

  // Install each skill
  for (const skill of skillsToInstall) {
    installSkill(skill);
  }

  console.log(`\n✓ Installation complete. Skills installed to: ${skillsBaseDir}`);
  console.log(`Target Node.js version: ≥ 18`);
}

// Run
main();
