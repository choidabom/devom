#!/bin/bash

# Epic Manager Script for Frontend Monorepo
# Usage: ./epic-manager.sh <command> [args...]

set -e

EPIC_DIR=".devom/epics"
CURRENT_EPIC_FILE=".devom/.current-epic"
TEMPLATE_FILE=".devom/templates/EPIC-TEMPLATE-FRONTEND.md"

# ULID 생성 함수
generate_ulid() {
  node -e "console.log(Date.now().toString(36) + Math.random().toString(36).substr(2, 9))"
}

# Epic 생성
create_epic() {
  local title="$1"
  local priority="${2:-medium}"

  if [ -z "$title" ]; then
    echo "Error: Epic title is required"
    echo "Usage: $0 create <title> [priority]"
    exit 1
  fi

  local epic_id="EPIC-$(generate_ulid)"
  local epic_path="$EPIC_DIR/$epic_id"

  # Epic 디렉토리 생성
  mkdir -p "$epic_path"

  # 템플릿 파일 확인 및 복사
  if [ -f "$TEMPLATE_FILE" ]; then
    # 템플릿 복사 후 변수 치환
    cp "$TEMPLATE_FILE" "$epic_path/EPIC.md"

    # ULID, date, priority 치환
    sed -i.bak "s/{ulid}/$epic_id/g" "$epic_path/EPIC.md"
    sed -i.bak "s/{date}/$(date +"%Y-%m-%d")/g" "$epic_path/EPIC.md"
    sed -i.bak "s/{priority}/$priority/g" "$epic_path/EPIC.md"
    rm -f "$epic_path/EPIC.md.bak"

    echo "✅ Epic created from template: $epic_id"
  else
    # 템플릿이 없으면 기본 형식으로 생성
    cat > "$epic_path/EPIC.md" << EOF
# $title

**Epic ID**: $epic_id
**Created**: $(date +"%Y-%m-%d")
**Priority**: $priority
**Status**: TODO

## Description

$title

## Acceptance Criteria

- [ ]

## Tasks

Tasks will be created by Claude (Scrum Master)

## Notes

-
EOF
    echo "✅ Epic created (basic format): $epic_id"
  fi

  # 현재 Epic 저장
  echo "$epic_id" > "$CURRENT_EPIC_FILE"

  echo "✅ Epic created: $epic_id"
  echo "📝 File: $epic_path/EPIC.md"
  echo ""
  echo "Next steps:"
  echo "1. Edit $epic_path/EPIC.md to add details"
  echo "2. Ask Claude to decompose this Epic into Tasks"
  echo "3. Create feature branch: git checkout -b feature/$epic_id"
}

# Epic 목록
list_epics() {
  echo "📋 Epic List"
  echo "============"
  echo ""

  if [ ! -d "$EPIC_DIR" ] || [ -z "$(ls -A $EPIC_DIR)" ]; then
    echo "No epics found."
    return
  fi

  for epic_path in "$EPIC_DIR"/EPIC-*; do
    if [ -f "$epic_path/EPIC.md" ]; then
      local epic_id=$(basename "$epic_path")
      local title=$(grep "^# " "$epic_path/EPIC.md" | head -1 | sed 's/^# //')
      local status=$(grep "^\*\*Status\*\*:" "$epic_path/EPIC.md" | sed 's/.*: //')
      local priority=$(grep "^\*\*Priority\*\*:" "$epic_path/EPIC.md" | sed 's/.*: //')

      echo "[$status] $epic_id - $title (Priority: $priority)"
    fi
  done
}

# Epic 상세 보기
show_epic() {
  local epic_id="$1"

  if [ -z "$epic_id" ]; then
    # 현재 Epic 표시
    if [ -f "$CURRENT_EPIC_FILE" ]; then
      epic_id=$(cat "$CURRENT_EPIC_FILE")
    else
      echo "Error: No current epic. Specify epic ID or create one."
      exit 1
    fi
  fi

  local epic_path="$EPIC_DIR/$epic_id/EPIC.md"

  if [ ! -f "$epic_path" ]; then
    echo "Error: Epic not found: $epic_id"
    exit 1
  fi

  cat "$epic_path"
}

# Epic 상태 업데이트
update_status() {
  local epic_id="$1"
  local new_status="$2"

  if [ -z "$epic_id" ] || [ -z "$new_status" ]; then
    echo "Error: Epic ID and status are required"
    echo "Usage: $0 status <epic-id> <TODO|IN_PROGRESS|IN_REVIEW|DONE>"
    exit 1
  fi

  local epic_path="$EPIC_DIR/$epic_id/EPIC.md"

  if [ ! -f "$epic_path" ]; then
    echo "Error: Epic not found: $epic_id"
    exit 1
  fi

  # Status 업데이트
  sed -i.bak "s/^\*\*Status\*\*:.*/\*\*Status\*\*: $new_status/" "$epic_path"
  rm -f "$epic_path.bak"

  echo "✅ Epic $epic_id status updated to: $new_status"
}

# Epic 완료
complete_epic() {
  local epic_id="$1"

  if [ -z "$epic_id" ]; then
    if [ -f "$CURRENT_EPIC_FILE" ]; then
      epic_id=$(cat "$CURRENT_EPIC_FILE")
    else
      echo "Error: No current epic. Specify epic ID."
      exit 1
    fi
  fi

  update_status "$epic_id" "DONE"

  # 현재 Epic 제거
  if [ -f "$CURRENT_EPIC_FILE" ]; then
    local current_id=$(cat "$CURRENT_EPIC_FILE")
    if [ "$current_id" = "$epic_id" ]; then
      rm -f "$CURRENT_EPIC_FILE"
    fi
  fi

  echo "🎉 Epic completed: $epic_id"
}

# 도움말
show_help() {
  cat << EOF
Epic Manager - Frontend Monorepo

Usage:
  $0 create <title> [priority]    Create new epic
  $0 list                          List all epics
  $0 show [epic-id]                Show epic details
  $0 status <epic-id> <status>     Update epic status
  $0 complete [epic-id]            Mark epic as complete
  $0 help                          Show this help

Priority:
  low, medium, high (default: medium)

Status:
  TODO, IN_PROGRESS, IN_REVIEW, DONE

Examples:
  $0 create "Add User Dashboard" high
  $0 list
  $0 show EPIC-m1n2o3p4
  $0 status EPIC-m1n2o3p4 IN_PROGRESS
  $0 complete EPIC-m1n2o3p4
EOF
}

# Main
case "$1" in
  create)
    create_epic "$2" "$3"
    ;;
  list)
    list_epics
    ;;
  show)
    show_epic "$2"
    ;;
  status)
    update_status "$2" "$3"
    ;;
  complete)
    complete_epic "$2"
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Error: Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
