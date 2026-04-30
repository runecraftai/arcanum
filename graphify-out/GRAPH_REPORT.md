# Graph Report - .  (2026-04-29)

## Corpus Check
- 49 files · ~85,011 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 196 nodes · 244 edges · 26 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `WorkflowEngine` - 12 edges
2. `installSkill()` - 8 edges
3. `TmuxLayout` - 8 edges
4. `updateSkill()` - 7 edges
5. `resultError()` - 5 edges
6. `createSkillSymlink()` - 5 edges
7. `buildBillingHeaderValue()` - 5 edges
8. `loadConfig()` - 4 edges
9. `scanDirectory()` - 4 edges
10. `getHubSkillPath()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (11): buildBillingHeaderValue(), computeCch(), computeVersionSuffix(), convertContentBlocks(), convertMessages(), extractFirstUserMessageText(), generatePKCE(), loginAnthropic() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.27
Nodes (17): computeRelativePath(), createHubSymlink(), createHubSymlinkOrError(), createSkillSymlink(), getHubSkillPath(), healSymlinkChain(), installSkill(), isPathWithin() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (6): discoverAgents(), findProjectAgentsDir(), loadAgentsFromDir(), runAgent(), sleep(), TmuxLayout

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (4): deepMerge(), loadConfig(), resolvePath(), tryReadFile()

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (2): persistState(), sanitizeWorkflowName()

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (1): WorkflowEngine

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (4): discoverSkills(), expandTilde(), parseFrontmatter(), scanDirectory()

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.38
Nodes (3): copyFile(), ensureDir(), symlinkFile()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (2): discoverInstalledSkills(), getInstalledSkillNames()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): resolveAgentPath(), resolveHome()

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (3): findSkills(), installSkill(), main()

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (3): loadSkillCatalog(), parseFrontmatter(), sanitizeSkillName()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 15`** (2 nodes): `main()`, `generate-schema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `update.ts`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `remove.ts`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `run()`, `list.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `run()`, `install.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `detectAgents()`, `detector.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `resolver.ts`, `resolveInstallPath()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `commitlint.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `registry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `installer.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorkflowEngine` connect `Community 6` to `Community 5`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._