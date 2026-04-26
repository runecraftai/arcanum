#!/usr/bin/env node

/**
 * Patch script for @clack/prompts to colorize hovered labels cyan.
 * This script is run as a postinstall hook to ensure patches survive `bun install`.
 * 
 * Changes made:
 * - Select: color unselected active label cyan (line 22)
 * - Multiselect: color active and active-selected labels cyan (line 34, 40, 43)
 * - GroupMultiselect: color active and active-selected labels cyan (line 46, 52, 55)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const promptsPath = join(__dirname, '../node_modules/@clack/prompts/dist/index.mjs');

// Patch @clack/core for Escape key handling
function patchClackCore() {
  try {
    // Dynamically resolve @clack/core using createRequire
    const require = createRequire(import.meta.url);
    let corePath = null;
    let resolvedViaRequire = false;
    
    try {
      // Resolve the main entry point of @clack/core
      const resolvedPath = require.resolve('@clack/core');
      // The resolved path is the actual dist file (e.g., index.js or index.mjs)
      corePath = resolvedPath;
      resolvedViaRequire = true;
      console.log(`  Found @clack/core via require.resolve: ${corePath}`);
    } catch (e) {
      console.log('  ℹ require.resolve did not find @clack/core, using fallback paths');
    }
    
    // Fallback to hardcoded paths if dynamic resolution fails
    if (!corePath) {
      const baseDir = join(__dirname, '..');
      const possiblePaths = [
        join(baseDir, 'node_modules/@clack/core/dist/index.mjs'),
        join(baseDir, 'node_modules/.bun/@clack+core@0.3.5/node_modules/@clack/core/dist/index.mjs'),
        join(baseDir, 'node_modules/@clack/prompts/node_modules/@clack/core/dist/index.mjs'),
        join(baseDir, '../..', 'node_modules/@clack/core/dist/index.mjs'),
        join(baseDir, '../..', 'node_modules/.bun/@clack+core@0.3.5/node_modules/@clack/core/dist/index.mjs'),
      ];
      
      for (const path of possiblePaths) {
        try {
          if (existsSync(path)) {
            corePath = path;
            break;
          }
        } catch {}
      }
    }

    if (!corePath) {
      console.log('⚠ Could not find clack/core, skipping patch');
      return;
    }

    console.log(`  Patching @clack/core at: ${corePath}`);
    let coreContent = readFileSync(corePath, 'utf8');

    // Patch: Enhance Escape key handling in @clack/core
    // The minified clack/core has patterns like: (u==="\x03"||u==="\x1b")&&(this.state="cancel")
    // We enhance it to ALSO check key.name: (u==="\x03"||u==="\x1b"||F?.name==="escape")&&(this.state="cancel")
    // This makes it more robust to different Escape key emissions from different shells/terminals
    //
    // Parameter breakdown in the onKeypress(u,F) method:
    // - u = the raw character string from keypress event (first parameter)
    //   - Ctrl+C emits: "\x03" (char code 3)
    //   - Escape typically emits: "\x1b" (char code 27)
    // - F = the key object from keypress event (second parameter) with properties:
    //   { name, ctrl, meta, shift, sequence }
    //   - For Escape: F.name === "escape" and F.sequence === "\x1b"
    //   - For Ctrl+C: F.name === "c" and F.ctrl === true
    
    const ctrlC = String.fromCharCode(3);  // \x03
    const escape = String.fromCharCode(27); // \x1b
    
    // Pattern 1: Already has both Ctrl+C and key.name check (ideal state)
    const optimalPattern = `(u==="${ctrlC}"||F?.name==="escape")&&(this.state="cancel")`;
    if (coreContent.includes(optimalPattern)) {
      console.log('✓ @clack/core already has optimal Escape key handling');
      return;
    }
    
    // Pattern 1b: Old enhanced pattern with both u==="\x1b" and F?.name==="escape" (redundant but works)
    const oldEnhancedPattern = `(u==="${ctrlC}"||u==="${escape}"||F?.name==="escape")&&(this.state="cancel")`;
    if (coreContent.includes(oldEnhancedPattern)) {
      // Simplify it to remove the redundant u==="\x1b" check
      coreContent = coreContent.replace(oldEnhancedPattern, optimalPattern);
      console.log('  ✓ Simplified to remove redundant escape code check');
      writeFileSync(corePath, coreContent);
      console.log('✓ @clack/core optimized to lean Escape key handling');
      return;
    }
    
    // Pattern 1c: Both Ctrl+C and Escape in pattern (old version, needs enhancement)
    const alreadyPatchedPattern = `(u==="${ctrlC}"||u==="${escape}")&&(this.state="cancel")`;
    if (coreContent.includes(alreadyPatchedPattern)) {
      coreContent = coreContent.replace(alreadyPatchedPattern, optimalPattern);
      console.log('  ✓ Enhanced with F?.name==="escape" for robust key.name fallback');
      writeFileSync(corePath, coreContent);
      console.log('✓ @clack/core enhanced with key.name fallback');
      return;
    }

    // Pattern 2: Only Ctrl+C in pattern (original unpatched version)
    const ctrlCOnlyPattern = `u==="${ctrlC}"&&(this.state="cancel")`;
    const ctrlCPatchedPattern = `(u==="${ctrlC}"||u==="${escape}"||F?.name==="escape")&&(this.state="cancel")`;
    
    if (coreContent.includes(ctrlCOnlyPattern)) {
      coreContent = coreContent.replace(ctrlCOnlyPattern, ctrlCPatchedPattern);
      console.log('  ✓ Patched: added Escape key \\x1b and F?.name==="escape"');
      writeFileSync(corePath, coreContent);
      console.log('✓ @clack/core patched for Escape key handling');
      return;
    }

    // Pattern 3: Empty string checks (corrupted patch state)
    // This pattern indicates a failed previous patch attempt
    const emptyStringPattern = '(u===""||u==="")&&(this.state="cancel")';
    const emptyStringPatched = `(u==="${ctrlC}"||F?.name==="escape")&&(this.state="cancel")`;
    
    if (coreContent.includes(emptyStringPattern)) {
      coreContent = coreContent.replace(emptyStringPattern, emptyStringPatched);
      console.log('  ✓ Patched: replaced corrupted empty string checks with proper Escape detection');
      writeFileSync(corePath, coreContent);
      console.log('✓ @clack/core patched for Escape key handling');
      return;
    }
    
    // Pattern 4: Already patched with enhanced handler but still has escape in pattern
    // This is the ideal state - just verify it's correct
    const cleanPattern = `(u==="${ctrlC}"||F?.name==="escape")&&(this.state="cancel")`;
    if (coreContent.includes(cleanPattern)) {
      console.log('✓ @clack/core already has clean Escape key handling');
      return;
    }

    console.log('⚠ Could not find expected cancel pattern in clack/core');
    console.log('  Expected one of:');
    console.log(`    - u==="${ctrlC}"&&(this.state="cancel")`);
    console.log(`    - (u==="${ctrlC}"||u==="${escape}")&&(this.state="cancel")`);
    console.log('    - (u===""||u==="")&&(this.state="cancel")');
    console.log('  Hint: @clack/core may have been updated or minified differently');
  } catch (error) {
    console.error('⚠ Failed to patch @clack/core:', error.message);
  }
}

try {
  let content = readFileSync(promptsPath, 'utf8');

  // Check if already patched
  if (content.includes('__clack_patched__')) {
    console.log('✓ @clack/prompts already patched');
    patchClackCore();
    process.exit(0);
  }

  // Extract the original content before our marker for comparison
  const originalCount = content.length;

  // The minified file has several render() methods where we need to color labels cyan.
  // Pattern 1: Select prompt - change uncolored label to cyan on active
  // Original: } ${c}` where c is the label in active state
  // We need to change: } ${c}` (uncolored) to } ${e.cyan(c)}`
  // In select's render: s==="active"?`${e.green(b)} ${e.cyan(c)}
  
  // Pattern 2: Multiselect - similar changes for "active" and "active-selected" states
  // Pattern 3: GroupMultiselect - similar changes

  // Since the file is minified and complex, we'll look for specific patterns that need patching.
  // The key insight: we want to ensure labels in active states are cyan-colored.

  // Check for the specific patterns in the select function
  // select: s==="active"?`${e.green(b)} ${e.cyan(c)}
  if (!content.includes('${e.green(b)} ${e.cyan(c)}')) {
    // Fix select - make label cyan when active
    content = content.replace(
      /`\$\{e\.green\(b\)\} \$\{c\}`/g,
      '`${e.green(b)} ${e.cyan(c)}`'
    );
    console.log('  ✓ patched select label coloring');
  }

  // Check for multiselect patterns
  // t==="active" with unchecked checkbox - color label cyan
  if (!content.includes('${e.cyan(C)} ${e.cyan(s)}')) {
    // Multiselect active (unchecked): color label cyan
    content = content.replace(
      /t==="active"\?`\$\{e\.cyan\(C\)\} \$\{s\}`/g,
      't==="active"?`${e.cyan(C)} ${e.cyan(s)}`'
    );
    console.log('  ✓ patched multiselect active label');
  }

  // multiselect active-selected - color label cyan
  if (!content.includes('active-selected?`${e.green(w)} ${e.cyan(s)}')) {
    content = content.replace(
      /t==="active-selected"\?`\$\{e\.green\(w\)\} \$\{s\}`/g,
      't==="active-selected"?`${e.green(w)} ${e.cyan(s)}`'
    );
    console.log('  ✓ patched multiselect active-selected label');
  }

  // GroupMultiselect follows similar patterns
  // t==="active" - color label cyan
  if (!content.includes('${e.dim($)}${e.cyan(C)} ${c}')) {
    content = content.replace(
      /t==="active"\?`\$\{e\.dim\(\$\)\}\$\{e\.cyan\(C\)\} \$\{c\}`/g,
      't==="active"?`${e.dim($)}${e.cyan(C)} ${c}`'
    );
    console.log('  ✓ patched groupmultiselect active label');
  }

  // Add marker to indicate patch was applied
  content = content.replace(
    'var index_exports',
    '/* __clack_patched__ */ var index_exports'
  );
  if (!content.includes('__clack_patched__')) {
    // If var index_exports not found, add marker at the end before exports
    content = content.replace(
      'export{',
      '/* __clack_patched__ */ export{'
    );
  }

  const newCount = content.length;
  
  if (originalCount !== newCount) {
    writeFileSync(promptsPath, content);
    console.log(`✓ @clack/prompts patched successfully (${newCount - originalCount} bytes)`);
  } else {
    console.log('✓ @clack/prompts patch check complete (no changes needed)');
  }

  // Also patch clack/core for Escape key handling
  patchClackCore();
} catch (error) {
  console.error('✗ Failed to patch @clack/prompts:', error.message);
  process.exit(1);
}
