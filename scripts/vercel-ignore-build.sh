#!/bin/bash
# Vercel Ignored Build Step
# feat/editor 브랜치에서 archive/docs 변경이 없으면 빌드 스킵
# 사용법: Vercel Dashboard > Project Settings > Git > Ignored Build Step
#   → bash scripts/vercel-ignore-build.sh

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# feat/editor 브랜치는 항상 스킵
if [[ "$VERCEL_GIT_COMMIT_REF" == feat/editor* ]]; then
  echo "🛑 Skipping build — feat/editor branch"
  exit 0
fi

# 그 외 브랜치는 빌드 진행
exit 1
