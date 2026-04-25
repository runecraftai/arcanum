<!-- Template: .specs/features/<name>/design.md — Large scope artifact. Replace all {{placeholders}}. -->
---
feature: {{feature-name}}
date: {{YYYY-MM-DD}}
status: draft
---

# Design: {{feature-name}}

**Spec**: `.specs/features/{{feature-name}}/spec.md`

## Architecture Overview

{{Describe the overall technical approach. Include a mermaid diagram if `mermaid-studio` skill is available.}}

```mermaid
{{diagram}}
```

## Code Reuse Analysis

| Existing Component | Location | Reuse Plan |
|-------------------|----------|------------|
| {{component}} | `{{path}}` | {{how it will be reused or extended}} |

## Components

### {{ComponentName}}

- **Purpose**: {{what it does}}
- **Location**: `{{path/to/file}}`
- **Interfaces**: {{key functions/types/exports}}
- **Dependencies**: {{what it depends on}}
- **Reuses**: {{existing code it builds on}}

## Data Models

```typescript
// {{ModelName}}
interface {{ModelName}} {
  {{field}}: {{type}};
}
```

## Error Handling

| Error Case | Behavior | User Impact |
|------------|----------|-------------|
| {{case}} | {{how handled}} | {{what user sees}} |

## Tech Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D1 | {{topic}} | {{choice}} | {{why}} |
