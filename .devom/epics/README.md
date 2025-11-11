# Epics Directory

이 디렉토리는 개발 중인 Epic 파일들을 저장합니다.

## ⚠️ Important: Local Only

이 디렉토리의 내용은 **gitignored**되어 있습니다:
- `EPIC-*` 디렉토리는 로컬 작업용
- 완료된 Epic 문서는 도메인 docs 폴더로 복사
- Git에는 이 README.md만 커밋됨

## Epic Structure

```
EPIC-{ulid}/
├── EPIC.md           # Epic 정의
└── TASK-*.md         # Task 파일들
```

## Usage

```bash
# Epic 생성
.devom/scripts/epic-manager.sh create "Feature Name" high

# Task 목록
.devom/scripts/task-manager.sh list

# Epic 완료
.devom/scripts/epic-manager.sh complete EPIC-xxx
```
