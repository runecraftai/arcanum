/**
 * Template interpolation for workflow step inputs
 * Supports {{step_id.output}} syntax for referencing previous step outputs
 */

/**
 * Extract step_id and output references from template
 */
export function extractOutputRef(template: string): string | null {
  const match = template.match(/\{\{(\w+)\.output\}\}/);
  return match ? match[1] : null;
}

/**
 * Interpolate template with step outputs
 * Replaces {{step_id.output}} patterns with values from stepOutputs
 * If referenced step hasn't run yet, leaves placeholder as-is
 */
export function interpolateTemplate(
  template: string,
  stepOutputs: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\.output\}\}/g, (match, stepId) => {
    const output = stepOutputs[stepId];
    return output !== undefined ? output : match;
  });
}
