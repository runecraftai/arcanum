# Archive Workflow

Once a feature is shipped, it can be archived for historical reference.

## Archive Directory Structure

```
.specs/archive/
├── 2026-04-24-user-auth-service/
│   ├── spec.md
│   ├── design.md
│   ├── tasks.md
│   └── STATE.md
├── 2026-04-20-payment-integration/
│   └── ...
```

Archive directory name format: `YYYY-MM-DD-<feature-name>`

## Archival Process

### Step 1: Verify Completion

Ensure feature is shipped:
- [ ] All tasks completed
- [ ] SHIP phase finished
- [ ] Code merged to main
- [ ] Version tag created

### Step 2: Create Archive Directory

```bash
mkdir -p .specs/archive/2026-04-24-user-auth-service
```

### Step 3: Move Feature Files

```bash
mv .specs/features/user-auth-service/* .specs/archive/2026-04-24-user-auth-service/
rmdir .specs/features/user-auth-service
```

### Step 4: Update Feature STATE

Create or update STATE.md in archive:

```yaml
---
feature: user-auth-service
status: archived
shipped: 2026-04-24
version: 1.3.0
---
```

### Step 5: Clean References

Remove any temporary files created during development:
- Build artifacts
- Compiled output
- Temporary config files

Keep only:
- spec.md
- design.md (if exists)
- tasks.md
- STATE.md

### Step 6: Git Cleanup (Optional)

If using git, commit the archive:

```bash
git add .specs/archive/
git commit -m "archive: ship user-auth-service v1.3.0"
```

## Archive Retrieval

If you need to reference an archived feature:

1. Browse `.specs/archive/` by date
2. Read spec.md, design.md, tasks.md
3. Check SESSION.md for context

Do not resume work from archived features — create a new feature spec instead.

## Cleanup Signals

Archive a feature when:
- ✓ Shipped to production
- ✓ No open blockers
- ✓ No pending work
- ✓ Session log complete
- ✓ Team informed

Do NOT archive if:
- ✗ Partial implementation (some tasks blocked)
- ✗ Planned follow-ups exist
- ✗ Critical bugs discovered post-ship
