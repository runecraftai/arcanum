# Vertical Slicing

Vertical slicing breaks down features into thin end-to-end slices that can be implemented and tested independently.

## Key Principles

- Each slice delivers measurable value
- Slices are ordered by dependency and priority
- Dependencies are explicit and visible
- Slices enable parallel work when safe

## Slice Template

1. **Scope**: What user value does this slice deliver?
2. **Dependencies**: What slices must complete first?
3. **Tasks**: Ordered task breakdown
4. **Acceptance**: How to verify completion
