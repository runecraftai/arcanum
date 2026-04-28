# Graph Report - .  (2026-04-28)

## Corpus Check
- 30 files · ~33,089 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 138 nodes · 169 edges · 21 communities detected
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

## God Nodes (most connected - your core abstractions)
1. `installSkill()` - 8 edges
2. `TmuxLayout` - 8 edges
3. `updateSkill()` - 7 edges
4. `resultError()` - 5 edges
5. `createSkillSymlink()` - 5 edges
6. `buildBillingHeaderValue()` - 5 edges
7. `getHubSkillPath()` - 4 edges
8. `computeRelativePath()` - 4 edges
9. `createHubSymlink()` - 4 edges
10. `resultSuccess()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (11): buildBillingHeaderValue(), computeCch(), computeVersionSuffix(), convertContentBlocks(), convertMessages(), extractFirstUserMessageText(), generatePKCE(), loginAnthropic() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.27
Nodes (17): computeRelativePath(), createHubSymlink(), createHubSymlinkOrError(), createSkillSymlink(), getHubSkillPath(), healSymlinkChain(), installSkill(), isPathWithin() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (5): discoverAgents(), findProjectAgentsDir(), loadAgentsFromDir(), runAgent(), sleep()

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.39
Nodes (1): TmuxLayout

### Community 6 - "Community 6"
Cohesion: 0.38
Nodes (3): copyFile(), ensureDir(), symlinkFile()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (2): discoverInstalledSkills(), getInstalledSkillNames()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (2): resolveAgentPath(), resolveHome()

### Community 9 - "Community 9"
Cohesion: 0.83
Nodes (3): findSkills(), installSkill(), main()

### Community 10 - "Community 10"
Cohesion: 0.83
Nodes (3): loadSkillCatalog(), parseFrontmatter(), sanitizeSkillName()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

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

## Knowledge Gaps
- **Thin community `Community 12`** (2 nodes): `update.ts`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `remove.ts`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `run()`, `list.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `run()`, `install.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `detectAgents()`, `detector.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `resolver.ts`, `resolveInstallPath()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `registry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `installer.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TmuxLayout` connect `Community 5` to `Community 3`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._