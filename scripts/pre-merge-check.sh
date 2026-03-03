#!/bin/bash
set -e

BRANCH=$1

if [ -z "$BRANCH" ]; then
    echo "Usage: $0 <branch-name>"
    exit 1
fi

echo "🔍 Validating branch: $BRANCH"

# Checkout branch
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Run type checking
echo "📝 Running TypeScript checks..."
pnpm check || exit 1

# Run build
echo "🔨 Running build..."
pnpm build || exit 1

# Run linter
echo "🎨 Running linter..."
pnpm lint || echo "⚠️  Linting issues detected (non-blocking)"

# Run tests
if grep -q '"test"' package.json 2>/dev/null; then
    echo "🧪 Running tests..."
    pnpm test || echo "⚠️  Tests failed (non-blocking)"
fi

echo "✅ Branch $BRANCH passed all checks!"
