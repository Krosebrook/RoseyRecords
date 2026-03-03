#!/bin/bash

echo "🧹 Post-Merge Branch Cleanup"

# Branches to clean up after successful merges
CLEANUP_BRANCHES=(
  "bolt/optimize-liked-songs-ids-10046034755163734552"
  "sentinel-security-headers-4390505156257242945"
  "sentinel/fix-audio-upload-signature-14951439939569141185"
  "copilot/sub-pr-33"
  "palette-ux-copy-button-18098717290305950768"
  "copilot/sub-pr-34"
  "copilot/sub-pr-34-again"
  "copilot/sub-pr-34-another-one"
  "bolt/optimize-song-list-payload-13459676292155677178"
  "copilot/sub-pr-35"
  "copilot/sub-pr-35-again"
  "copilot/sub-pr-35-another-one"
  "copilot/sub-pr-21"
  "copilot/sub-pr-21-again"
  "copilot/sub-pr-21-another-one"
  "copilot/sub-pr-30"
  "palette-ux-generate-a11y-10454607739040895960"
)

echo "⚠️  This will delete the following branches:"
printf '%s\n' "${CLEANUP_BRANCHES[@]}"
echo ""
read -p "Continue? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

for branch in "${CLEANUP_BRANCHES[@]}"; do
    echo "Processing: $branch"
    
    # Delete local branch
    if git show-ref --verify --quiet refs/heads/"$branch"; then
        git branch -d "$branch" 2>/dev/null && echo "  ✅ Deleted locally" || echo "  ⚠️  Could not delete locally"
    fi
    
    # Delete remote branch
    git push origin --delete "$branch" 2>/dev/null && echo "  ✅ Deleted remotely" || echo "  ℹ️  Not found remotely"
done

echo ""
echo "✅ Cleanup complete!"
echo "Run 'git fetch --prune' to update your local refs"
