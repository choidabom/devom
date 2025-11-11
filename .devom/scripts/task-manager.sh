#!/bin/bash

# Task Manager Script for Frontend Monorepo
# Usage: ./task-manager.sh <command> [args...]

set -e

EPIC_DIR=".devom/epics"
CURRENT_EPIC_FILE=".devom/.current-epic"

# ULID 생성 함수
generate_ulid() {
  node -e "console.log(Date.now().toString(36) + Math.random().toString(36).substr(2, 9))"
}

# 현재 Epic 가져오기
get_current_epic() {
  if [ ! -f "$CURRENT_EPIC_FILE" ]; then
    echo "Error: No current epic. Create or select an epic first."
    exit 1
  fi
  cat "$CURRENT_EPIC_FILE"
}

# Task 생성
create_task() {
  local epic_id=$(get_current_epic)
  local task_type="$1"
  local title="$2"
  local assigned_agent="${3:-component-writer}"

  if [ -z "$task_type" ] || [ -z "$title" ]; then
    echo "Error: Task type and title are required"
    echo "Usage: $0 create <type> <title> [agent]"
    exit 1
  fi

  local task_id="TASK-$(generate_ulid)"
  local epic_path="$EPIC_DIR/$epic_id"
  local task_file="$epic_path/$task_id.md"

  # Task 파일 생성
  cat > "$task_file" << EOF
# $title

**Task ID**: $task_id
**Epic**: $epic_id
**Type**: $task_type
**Status**: TODO
**Assigned**: $assigned_agent
**Created**: $(date +"%Y-%m-%d %H:%M:%S")

## Description

$title

## Acceptance Criteria

- [ ]

## Implementation Notes

-

## Progress Log

- $(date +"%Y-%m-%d %H:%M:%S"): Task created
EOF

  echo "✅ Task created: $task_id"
  echo "📝 File: $task_file"
}

# Task 목록
list_tasks() {
  local epic_id=$(get_current_epic)
  local epic_path="$EPIC_DIR/$epic_id"

  echo "📋 Task List for Epic: $epic_id"
  echo "=============================="
  echo ""

  if [ ! -d "$epic_path" ]; then
    echo "No tasks found."
    return
  fi

  for task_file in "$epic_path"/TASK-*.md; do
    if [ -f "$task_file" ]; then
      local task_id=$(basename "$task_file" .md)
      local title=$(grep "^# " "$task_file" | head -1 | sed 's/^# //')
      local status=$(grep "^\*\*Status\*\*:" "$task_file" | sed 's/.*: //')
      local task_type=$(grep "^\*\*Type\*\*:" "$task_file" | sed 's/.*: //')
      local agent=$(grep "^\*\*Assigned\*\*:" "$task_file" | sed 's/.*: //')

      echo "[$status] $task_id ($task_type) - $title"
      echo "   Assigned: $agent"
      echo ""
    fi
  done
}

# Task 상태 업데이트
update_task() {
  local epic_id=$(get_current_epic)
  local task_id="$1"
  local new_status="$2"
  local agent="$3"
  local note="$4"

  if [ -z "$task_id" ] || [ -z "$new_status" ]; then
    echo "Error: Task ID and status are required"
    echo "Usage: $0 update <task-id> <status> [agent] [note]"
    exit 1
  fi

  local task_file="$EPIC_DIR/$epic_id/$task_id.md"

  if [ ! -f "$task_file" ]; then
    echo "Error: Task not found: $task_id"
    exit 1
  fi

  # Status 업데이트
  sed -i.bak "s/^\*\*Status\*\*:.*/\*\*Status\*\*: $new_status/" "$task_file"

  # Agent 업데이트 (제공된 경우)
  if [ -n "$agent" ]; then
    sed -i.bak "s/^\*\*Assigned\*\*:.*/\*\*Assigned\*\*: $agent/" "$task_file"
  fi

  # Progress Log 추가
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  local log_entry="- $timestamp: Status changed to $new_status"

  if [ -n "$note" ]; then
    log_entry="$log_entry - $note"
  fi

  echo "$log_entry" >> "$task_file"

  rm -f "$task_file.bak"

  echo "✅ Task $task_id updated to: $new_status"
}

# Task 상세 보기
show_task() {
  local epic_id=$(get_current_epic)
  local task_id="$1"

  if [ -z "$task_id" ]; then
    echo "Error: Task ID is required"
    echo "Usage: $0 show <task-id>"
    exit 1
  fi

  local task_file="$EPIC_DIR/$epic_id/$task_id.md"

  if [ ! -f "$task_file" ]; then
    echo "Error: Task not found: $task_id"
    exit 1
  fi

  cat "$task_file"
}

# 도움말
show_help() {
  cat << EOF
Task Manager - Frontend Monorepo

Usage:
  $0 create <type> <title> [agent]       Create new task
  $0 list                                List all tasks in current epic
  $0 show <task-id>                      Show task details
  $0 update <task-id> <status> [agent] [note]  Update task status
  $0 help                                Show this help

Task Types:
  feat        - New feature (component, hook, etc.)
  test        - Test implementation
  docs        - Documentation
  refactor    - Code refactoring
  fix         - Bug fix
  style       - Styling (CSS, Tailwind)
  perf        - Performance optimization
  a11y        - Accessibility improvement
  storybook   - Storybook stories

Task Status:
  TODO, IN_PROGRESS, READY_FOR_COMMIT, DONE

Agents:
  component-writer, hook-writer, style-writer, storybook-writer, code-reviewer

Examples:
  $0 create feat "Create Button component" component-writer
  $0 list
  $0 show TASK-m1n2o3p4
  $0 update TASK-m1n2o3p4 IN_PROGRESS component-writer "Started implementation"
  $0 update TASK-m1n2o3p4 DONE component-writer "Component completed and tested"
EOF
}

# Main
case "$1" in
  create)
    create_task "$2" "$3" "$4"
    ;;
  list)
    list_tasks
    ;;
  show)
    show_task "$2"
    ;;
  update)
    update_task "$2" "$3" "$4" "$5"
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
