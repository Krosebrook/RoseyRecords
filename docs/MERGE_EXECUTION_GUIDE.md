# Merge Execution Guide

## Prerequisites

1. **Write access** to Krosebrook/RoseyRecords
2. **Git configured** with SSH or HTTPS
3. **pnpm installed** globally
4. **Clean working directory** (no uncommitted changes)

## Quick Start

```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Run automated merge (interactive)
./scripts/merge-manager.sh all

# 3. Or run phase-by-phase:
./scripts/merge-manager.sh phase1  # Update repo
./scripts/merge-manager.sh phase2  # Independent merges
# ... merge via GitHub UI ...
./scripts/merge-manager.sh phase3a # Audio security
./scripts/merge-manager.sh phase3b # Copy button
./scripts/merge-manager.sh phase3c # Song list
./scripts/merge-manager.sh phase4  # Cleanup
```

## Manual Merge via GitHub UI

For PRs #31 and #23, use GitHub web interface:

1. Go to PR page
2. Click "Squash and merge"
3. Edit commit message using template
4. Confirm merge
5. Delete branch after merge

## Conflict Resolution

If you encounter conflicts, refer to templates in:
- `scripts/conflict-resolutions/`

Apply the template for the conflicted file, then:

```bash
git add <conflicted-file>
git commit -m "Resolve conflicts in <file>"
git push origin <branch-name>
```

## Verification Checklist

After all merges:

- [ ] All PRs closed
- [ ] CI/CD passing on main
- [ ] No orphaned branches
- [ ] Deploy to staging successful
- [ ] Smoke tests pass

## Detailed Phase Breakdown

### Phase 1: Repository Update

Updates the local repository with the latest changes from main and fetches all branches.

```bash
./scripts/merge-manager.sh phase1
```

### Phase 2: Independent Merges

Validates branches that can be merged independently without cascading dependencies:

- **PR #31**: Optimize liked songs IDs query
- **PR #23**: Add security headers (HSTS, CSP)

These PRs should be merged via GitHub UI using "Squash and merge" option.

```bash
./scripts/merge-manager.sh phase2
```

After validation completes, merge these PRs via GitHub web interface.

### Phase 3a: Audio Security Chain

Merges PR #38 (sub-PR) into PR #33's branch for audio upload signature validation:

```bash
./scripts/merge-manager.sh phase3a
```

Then merge PR #33 via GitHub UI once validated.

### Phase 3b: Copy Button Chain

Merges PR #39 (sub-PR) into PR #34's branch for clipboard functionality:

```bash
./scripts/merge-manager.sh phase3b
```

Then merge PR #34 via GitHub UI once validated.

### Phase 3c: Song List Optimization Chain

Merges multiple sub-PRs (#37, #40, #43) into PR #35's branch for song list payload optimization:

```bash
./scripts/merge-manager.sh phase3c
```

Then merge PR #35 via GitHub UI once validated.

### Phase 4: Cleanup

Generates a checklist of branches to delete after successful merges:

```bash
./scripts/merge-manager.sh phase4
```

Then run the cleanup script:

```bash
./scripts/cleanup-branches.sh
```

## Pre-Merge Validation

Before merging any branch, you can validate it independently:

```bash
./scripts/pre-merge-check.sh <branch-name>
```

This will:
- Checkout the branch
- Install dependencies if needed
- Run TypeScript type checking
- Run the build process
- Run linting (non-blocking)
- Run tests if available (non-blocking)

## Troubleshooting

### Merge Conflicts

If you encounter merge conflicts during automated merging:

1. Review the conflict templates in `scripts/conflict-resolutions/`
2. Manually resolve conflicts using the templates as guidance
3. Run validation after resolving:
   ```bash
   pnpm check && pnpm build
   ```
4. Commit and push the resolution

### Failed Validation

If a branch fails validation (type checking or build):

1. Review the error messages
2. Fix issues in the branch
3. Re-run validation:
   ```bash
   ./scripts/pre-merge-check.sh <branch-name>
   ```

### GitHub Actions Failures

The `merge-validation.yml` workflow runs automatically on all PRs to main. If it fails:

1. Check the workflow run logs in GitHub Actions tab
2. Address any issues found
3. Push fixes to the PR branch
4. Workflow will re-run automatically

## Common Conflict Patterns

### HSTS Header Configuration

When merging security header PRs, ensure HSTS is only enabled in production over HTTPS:

```typescript
if (process.env.NODE_ENV === "production" && req.secure) {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
}
```

See: `scripts/conflict-resolutions/server-index-hsts.ts`

### Song List Selection

When merging song list optimization PRs, use the shared `getSongListSelection()` helper:

See: `scripts/conflict-resolutions/server-storage-song-list.ts`

### Audio MIME Detection

When merging audio validation PRs, ensure proper M4A brand checking:

See: `scripts/conflict-resolutions/server-utils-audio.ts`

### Clipboard Utility

When merging clipboard feature PRs, use the shared `copyToClipboard()` utility:

See: `scripts/conflict-resolutions/client-utils-clipboard.ts`

## Post-Merge Checklist

After completing all merges:

1. **Verify main branch**:
   ```bash
   git checkout main
   git pull origin main
   pnpm install
   pnpm check
   pnpm build
   ```

2. **Run full test suite** (if available):
   ```bash
   pnpm test
   ```

3. **Clean up local branches**:
   ```bash
   ./scripts/cleanup-branches.sh
   git fetch --prune
   ```

4. **Verify GitHub**:
   - All PRs are closed
   - All feature branches are deleted
   - GitHub Actions workflows are passing on main

5. **Deploy to staging** and run smoke tests

## Support

If you encounter issues not covered in this guide:

1. Check the repository's main documentation
2. Review the conflict resolution templates
3. Consult with the team for manual intervention if needed

## Notes

- The automated scripts use `pnpm` as the package manager
- All scripts include error handling and will exit on failures
- Validation steps are designed to be non-destructive
- Manual intervention may be required for complex conflicts
- Always review changes before pushing to remote branches
