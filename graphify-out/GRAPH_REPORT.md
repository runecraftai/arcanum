# Graph Report - .  (2026-04-24)

## Corpus Check
- 3 files · ~14,067 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7 nodes · 6 edges · 3 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 3 edges
2. `findSkills()` - 2 edges
3. `installSkill()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.83
Nodes (3): findSkills(), installSkill(), main()

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (0): 

### Community 2 - "Community 2"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 1`** (2 nodes): `run()`, `install.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (1 nodes): `cli.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._