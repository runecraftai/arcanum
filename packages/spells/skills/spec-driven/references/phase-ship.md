# Phase: SHIP

## When

After SIMPLIFY is complete, when user triggers: `/ship`, `release`, `publish`, `ship it`, `vamos fazer release`, `versiona`

## Goal

Release the feature to production following a structured pre-ship checklist, version management, changelog documentation, and post-ship verification.

## Steps

### Step 1: Pre-Ship Checklist

Before shipping, verify all quality gates:

```markdown
## Pre-Ship Checklist

- [ ] All tasks completed in tasks.md
- [ ] All tests passing: npm test
- [ ] Linter passing: npm run lint
- [ ] Type checking passing (if TypeScript): npm run type-check
- [ ] No console.log() or debug code left
- [ ] No hardcoded secrets or API keys
- [ ] No TODO comments blocking ship
- [ ] Build successful: npm run build
- [ ] No new vulnerabilities: npm audit
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added
- [ ] Version number bumped in package.json
- [ ] Feature branch integrated to main
```

If any gate fails:
- Fix the issue
- Re-test
- Return to appropriate phase if needed
- Do not ship until all gates pass

### Step 2: Version Management

Update version following **Semantic Versioning**:

```
MAJOR.MINOR.PATCH

- MAJOR: Breaking changes (increment when incompatible API changes)
- MINOR: New features, backwards compatible (increment when adding functionality)
- PATCH: Bug fixes (increment for bug fix releases)
```

**Current version**: Check `package.json`:
```json
{
  "name": "project-name",
  "version": "1.2.3"
}
```

**Determine new version**:
- If bug fix only → `1.2.4`
- If new feature → `1.3.0`
- If breaking change → `2.0.0`

**Update version**:
```json
{
  "version": "1.3.0"
}
```

Also update in:
- Any other version files (CHANGELOG.md header, docs, etc.)

### Step 3: Changelog Entry

Create or update `CHANGELOG.md` following **Keep a Changelog** format:

```markdown
# Changelog

All notable changes to this project are documented here.

## [1.3.0] - 2026-04-24

### Added
- User authentication with email/password (FEAT-01 to FEAT-05)
- Secure session management with JWT tokens
- Password reset via email
- User profile management endpoints

### Changed
- Updated auth middleware to support new token format
- Refactored login flow for clarity

### Fixed
- Session timeout was not being enforced correctly

### Security
- Added input validation on all auth endpoints
- Implemented rate limiting on login attempts

## [1.2.3] - 2026-04-20

### Fixed
- Bug in email validation regex

---

[Unreleased]: https://github.com/org/project/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/org/project/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/org/project/releases/tag/v1.2.3
```

**Fill in the entry**:
1. Use version number from Step 2
2. Use today's date in `YYYY-MM-DD` format
3. List changes by category:
   - **Added**: New features
   - **Changed**: Modifications to existing features
   - **Fixed**: Bug fixes
   - **Deprecated**: Features being phased out
   - **Removed**: Removed features
   - **Security**: Security-related changes

4. Reference requirement IDs or tasks: "User authentication (FEAT-01 to FEAT-05)"

### Step 4: Git Operations

Prepare release commit:

```bash
# Verify working directory is clean
git status

# Stage version and changelog changes
git add package.json CHANGELOG.md

# Create release commit
git commit -m "chore: release v1.3.0 - user authentication feature"

# Create git tag for release
git tag -a v1.3.0 -m "Release v1.3.0: user authentication"

# Push to remote
git push origin main
git push origin v1.3.0
```

### Step 5: Build & Publish (if applicable)

If project publishes to npm or other registry:

```bash
# Verify build is successful
npm run build

# Login to registry (if needed)
npm login

# Publish release
npm publish --access public

# Verify publication
npm view project-name versions
```

### Step 6: Post-Ship Verification

After shipping:

1. **Verify in production** (if deployed):
   - Access the feature in production
   - Test basic workflow
   - Check logs for errors

2. **Monitor metrics**:
   - User adoption rate
   - Error rate
   - Performance metrics

3. **Document release**:
   - Create GitHub release page (if using GitHub):
     ```
     Title: v1.3.0 - User Authentication
     Description: [copy CHANGELOG.md entry]
     Attachments: None (code is the artifact)
     ```

4. **Communicate**:
   - Notify stakeholders of release
   - Share changelog with team
   - Update documentation websites

### Step 7: Post-Ship Documentation

Create a post-ship summary:

```markdown
## SHIP Complete

**Version**: 1.3.0
**Released**: 2026-04-24
**Commit**: abc1234
**Tag**: v1.3.0

### Changes in Release
- User authentication with email/password
- Secure session management with JWT
- Password reset functionality
- User profile endpoints

### Test Results
- Unit tests: 156 passed, 0 failed
- Integration tests: 24 passed, 0 failed
- Coverage: 85%

### Deployment Status
- Production: ✓ Deployed
- All systems: ✓ Healthy
- No errors in logs

### Open Items
- None

### Follow-up Actions
- Monitor user adoption
- Schedule post-release review in 1 week
```

### Step 8: Archive Feature

Once shipped:

1. Mark feature complete in `.specs/`:
   ```markdown
   ---
   feature: user-auth-service
   status: shipped
   shipped_date: 2026-04-24
   version: 1.3.0
   ---
   ```

2. If using archival workflow (see `archive-workflow.md`):
   ```bash
   mv .specs/features/user-auth-service .specs/archive/2026-04-24-user-auth-service/
   ```

### Step 9: Completion

Report final status:

```
## SHIP Complete

Feature: user-auth-service
Version: 1.3.0
Released: 2026-04-24
Status: ✓ In Production

CHANGELOG.md updated: ✓
Git tag created: ✓
npm published: ✓ (if applicable)
Deployment verified: ✓
Post-ship monitoring: Active

Next steps: Monitor adoption, schedule post-release review
```

## Supporting References

- `archive-workflow.md` — Post-ship cleanup and archival

## Pre-Ship Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing (100%)
- [ ] Linter passing
- [ ] No security vulnerabilities
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] CHANGELOG.md filled in
- [ ] Version bumped semantically
- [ ] Build successful
- [ ] Commit message clear

## Completion Criteria

✓ SHIP phase is complete when:
1. Version is bumped
2. CHANGELOG.md updated
3. Release tag created (if git used)
4. Published to registry (if applicable)
5. Production deployment verified
6. Post-ship monitoring active
7. Feature marked as `shipped` in spec
