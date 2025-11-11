#!/bin/bash

# pnpm catalog 자동 업데이트 스크립트
# 사용법:
#   ./scripts/update-catalog.sh           # 모든 catalog 패키지 확인
#   ./scripts/update-catalog.sh typescript # 특정 패키지만 확인

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 pnpm catalog 업데이트 도구${NC}\n"

# pnpm-workspace.yaml에서 catalog 추출
WORKSPACE_FILE="pnpm-workspace.yaml"

if [ ! -f "$WORKSPACE_FILE" ]; then
  echo -e "${RED}❌ pnpm-workspace.yaml 파일을 찾을 수 없습니다.${NC}"
  exit 1
fi

# 특정 패키지만 업데이트할지 확인
TARGET_PACKAGE="$1"

# catalog 섹션 추출 (catalog: 부터 catalogs: 또는 파일 끝까지)
CATALOG_SECTION=$(awk '/^catalog:$/,/^catalogs:|^$/' "$WORKSPACE_FILE" | grep -v "^catalog:" | grep -v "^catalogs:")

if [ -z "$CATALOG_SECTION" ]; then
  echo -e "${YELLOW}⚠️  catalog 섹션이 비어있거나 찾을 수 없습니다.${NC}"
  exit 0
fi

# 업데이트할 패키지 목록
declare -a PACKAGES_TO_UPDATE=()
declare -a CURRENT_VERSIONS=()
declare -a LATEST_VERSIONS=()

echo -e "${BLUE}🔍 설치된 패키지 버전 확인 중...${NC}\n"

# catalog에서 패키지 추출
while IFS= read -r line; do
  # 빈 줄이나 주석 제거
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # 패키지명과 버전 추출 (예: "typescript: ^5.7.3" 또는 typescript: "^5.7.3")
  if [[ "$line" =~ ^[[:space:]]*([^:]+):[[:space:]]*(.+)$ ]]; then
    # 패키지명에서 따옴표 제거
    package_name="${BASH_REMATCH[1]}"
    package_name="${package_name//\"/}"
    package_name="${package_name// /}"

    # 버전에서 따옴표 제거
    current_version="${BASH_REMATCH[2]}"
    current_version="${current_version//\"/}"
    current_version="${current_version// /}"

    # 특정 패키지만 체크하는 경우
    if [ -n "$TARGET_PACKAGE" ] && [ "$package_name" != "$TARGET_PACKAGE" ]; then
      continue
    fi

    # npm registry에서 최신 버전 확인
    echo -n "  $package_name (현재: $current_version) ... "

    latest_version=$(npm view "$package_name" version 2>/dev/null || echo "")

    if [ -z "$latest_version" ]; then
      echo -e "${RED}실패${NC}"
      continue
    fi

    # 버전 비교 (^, ~ 제거)
    clean_current=$(echo "$current_version" | sed 's/[\^~]//g')

    if [ "$clean_current" != "$latest_version" ]; then
      echo -e "${YELLOW}업데이트 가능: $latest_version${NC}"
      PACKAGES_TO_UPDATE+=("$package_name")
      CURRENT_VERSIONS+=("$current_version")
      LATEST_VERSIONS+=("$latest_version")
    else
      echo -e "${GREEN}최신 버전${NC}"
    fi
  fi
done <<< "$CATALOG_SECTION"

# 업데이트할 패키지가 없으면 종료
if [ ${#PACKAGES_TO_UPDATE[@]} -eq 0 ]; then
  echo -e "\n${GREEN}✅ 모든 패키지가 최신 버전입니다!${NC}"
  exit 0
fi

# 업데이트 요약 출력
echo -e "\n${YELLOW}📋 업데이트 가능한 패키지:${NC}"
for i in "${!PACKAGES_TO_UPDATE[@]}"; do
  echo "  [$((i+1))] ${PACKAGES_TO_UPDATE[$i]}: ${CURRENT_VERSIONS[$i]} → ${LATEST_VERSIONS[$i]}"
done

# 사용자 확인
echo ""
read -rp "위 패키지들을 업데이트하시겠습니까? (y/N): " confirm

if [[ ! "$confirm" =~ ^[yY]$ ]]; then
  echo -e "${YELLOW}⏸️  업데이트가 취소되었습니다.${NC}"
  exit 0
fi

# 업데이트 적용
echo -e "${BLUE}🔄 catalog 업데이트 중...${NC}\n"

for i in "${!PACKAGES_TO_UPDATE[@]}"; do
  package="${PACKAGES_TO_UPDATE[$i]}"
  old_version="${CURRENT_VERSIONS[$i]}"
  new_version="${LATEST_VERSIONS[$i]}"

  # 버전 prefix 유지 (^, ~)
  if [[ "$old_version" =~ ^\^ ]]; then
    new_version="^$new_version"
  elif [[ "$old_version" =~ ^~ ]]; then
    new_version="~$new_version"
  fi

  echo "  ✓ $package: $old_version → $new_version"

  # sed로 버전 업데이트 (스코프 패키지와 일반 패키지 모두 처리)
  # 패키지명을 escape 처리
  escaped_package=$(echo "$package" | sed 's/[@/]/\\&/g')

  # 따옴표 있는 경우와 없는 경우 모두 처리
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # "package": "version" 형식
    sed -i '' "s|\"${escaped_package}\":[[:space:]]*\"${old_version}\"|\"${package}\": \"${new_version}\"|g" "$WORKSPACE_FILE"
    # package: "version" 형식
    sed -i '' "s|${escaped_package}:[[:space:]]*\"${old_version}\"|${package}: \"${new_version}\"|g" "$WORKSPACE_FILE"
  else
    sed -i "s|\"${escaped_package}\":[[:space:]]*\"${old_version}\"|\"${package}\": \"${new_version}\"|g" "$WORKSPACE_FILE"
    sed -i "s|${escaped_package}:[[:space:]]*\"${old_version}\"|${package}: \"${new_version}\"|g" "$WORKSPACE_FILE"
  fi
done

echo -e "\n${GREEN}✅ catalog 업데이트 완료!${NC}"

# pnpm install 실행
echo -e "\n${BLUE}📦 의존성 재설치 중...${NC}"
pnpm install

echo -e "\n${GREEN}🎉 모든 작업이 완료되었습니다!${NC}"
