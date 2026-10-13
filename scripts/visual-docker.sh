#!/usr/bin/env bash
# Run Playwright visual tests in the official Linux image so screenshots match CI baselines.
# Usage: pnpm visual:docker [playwright args]   e.g. pnpm visual:docker --update-snapshots
set -euo pipefail
cd "$(dirname "$0")/.."

PW_VERSION=$(node -p "require('@playwright/test/package.json').version")
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"

# node_modules lives in a named volume so Linux-native deps don't clobber your macOS install.
docker run --rm -t \
  -v "$PWD":/work \
  -v brownlow_design_node_modules:/work/node_modules \
  -w /work \
  -e CI=1 -e NEXT_PUBLIC_LAB=1 \
  "$IMAGE" \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm exec playwright test $*"
