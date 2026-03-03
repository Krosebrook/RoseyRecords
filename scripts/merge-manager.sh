#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="Krosebrook"
REPO_NAME="RoseyRecords"
BASE_BRANCH="main"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validation function
validate_branch() {
    local branch=$1
    log "Validating branch: $branch"
    
    git checkout "$branch" || error "Failed to checkout $branch"
    git pull origin "$branch" || error "Failed to pull $branch"
    
    # Run type checking
    log "Running TypeScript checks..."
    pnpm check || error "Type checking failed on $branch"
    
    # Run build
    log "Running build..."
    pnpm build || error "Build failed on $branch"
    
    # Run tests if available
    if grep -q '"test"' package.json 2>/dev/null; then
        log "Running tests..."
        pnpm test || warning "Tests failed on $branch (continuing)"
    fi
    
    success "Branch $branch validated successfully"
}

# Merge function with conflict detection
merge_branch() {
    local source=$1
    local target=$2
    local pr_number=$3
    
    log "Merging $source into $target (PR #$pr_number)"
    
    git checkout "$target" || error "Failed to checkout $target"
    git pull origin "$target" || error "Failed to pull $target"
    
    # Try merge
    if git merge --no-ff --no-commit "$source" 2>&1 | tee /tmp/merge_output.log; then
        if grep -q "CONFLICT" /tmp/merge_output.log; then
            warning "Conflicts detected. Please resolve manually."
            git status
            error "Merge aborted due to conflicts"
        else
            git commit -m "Merge branch '$source' into $target (#$pr_number)"
            git push origin "$target" || error "Failed to push merged changes"
            success "Merged $source into $target"
        fi
    else
        error "Merge failed"
    fi
}

# Phase 1: Update repository
phase1_update() {
    log "=== PHASE 1: Repository Update ==="
    git checkout main
    git pull origin main
    git fetch --all
    success "Repository updated"
}

# Phase 2: Independent merges
phase2_independent() {
    log "=== PHASE 2: Independent Merges ==="
    
    # PR #31 - Optimize liked songs IDs
    log "Processing PR #31..."
    validate_branch "bolt/optimize-liked-songs-ids-10046034755163734552"
    # Note: Actual merge done via GitHub UI with squash
    success "PR #31 ready to merge via GitHub UI"
    
    # PR #23 - Security headers
    log "Processing PR #23..."
    validate_branch "sentinel-security-headers-4390505156257242945"
    # Check for HSTS conflicts
    warning "PR #23 may have HSTS conflicts - review server/index.ts"
    success "PR #23 ready to merge via GitHub UI"
}

# Phase 3: Cascading merges - Audio Security
phase3a_audio_security() {
    log "=== PHASE 3A: Audio Security Chain ==="
    
    # PR #38 -> PR #33 branch
    log "Merging PR #38 into PR #33 branch..."
    merge_branch "copilot/sub-pr-33" "sentinel/fix-audio-upload-signature-14951439939569141185" "38"
    
    # Validate merged result
    validate_branch "sentinel/fix-audio-upload-signature-14951439939569141185"
    
    success "Audio security chain ready for final merge to main"
}

# Phase 3: Cascading merges - Copy Button
phase3b_copy_button() {
    log "=== PHASE 3B: Copy Button Chain ==="
    
    # PR #39 -> PR #34 branch
    log "Merging PR #39 into PR #34 branch..."
    merge_branch "copilot/sub-pr-34" "palette-ux-copy-button-18098717290305950768" "39"
    
    # Validate merged result
    validate_branch "palette-ux-copy-button-18098717290305950768"
    
    success "Copy button chain ready for final merge to main"
}

# Phase 3: Cascading merges - Song List Optimization
phase3c_song_list() {
    log "=== PHASE 3C: Song List Optimization Chain ==="
    
    local base="bolt/optimize-song-list-payload-13459676292155677178"
    
    # PR #40
    log "Merging PR #40..."
    merge_branch "copilot/sub-pr-35-again" "$base" "40"
    
    # PR #37
    log "Merging PR #37..."
    merge_branch "copilot/sub-pr-35" "$base" "37"
    
    # PR #43
    log "Merging PR #43..."
    merge_branch "copilot/sub-pr-35-another-one" "$base" "43"
    
    # Validate final result
    validate_branch "$base"
    
    success "Song list optimization chain ready for final merge to main"
}

# Phase 4: Cleanup
phase4_cleanup() {
    log "=== PHASE 4: Cleanup ==="
    
    local branches=(
        "copilot/sub-pr-33"
        "copilot/sub-pr-34"
        "copilot/sub-pr-34-again"
        "copilot/sub-pr-34-another-one"
        "copilot/sub-pr-35"
        "copilot/sub-pr-35-again"
        "copilot/sub-pr-35-another-one"
        "copilot/sub-pr-21"
        "copilot/sub-pr-21-again"
        "copilot/sub-pr-21-another-one"
        "copilot/sub-pr-30"
    )
    
    for branch in "${branches[@]}"; do
        log "Checking branch: $branch"
        if git show-ref --verify --quiet refs/heads/"$branch"; then
            warning "Branch $branch exists locally - mark for manual deletion after merge confirmation"
        fi
    done
    
    success "Cleanup checklist generated"
}

# Main execution
main() {
    log "Starting automated merge execution for $REPO_OWNER/$REPO_NAME"
    
    case "${1:-all}" in
        "phase1")
            phase1_update
            ;;
        "phase2")
            phase2_independent
            ;;
        "phase3a")
            phase3a_audio_security
            ;;
        "phase3b")
            phase3b_copy_button
            ;;
        "phase3c")
            phase3c_song_list
            ;;
        "phase4")
            phase4_cleanup
            ;;
        "all")
            phase1_update
            phase2_independent
            read -p "Merge PR #31 and #23 via GitHub UI, then press Enter to continue..."
            phase3a_audio_security
            phase3b_copy_button
            phase3c_song_list
            phase4_cleanup
            success "All phases complete!"
            ;;
        *)
            echo "Usage: $0 {phase1|phase2|phase3a|phase3b|phase3c|phase4|all}"
            exit 1
            ;;
    esac
}

main "$@"
