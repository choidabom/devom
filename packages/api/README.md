# GitHub Actions Workflow Test

이 패키지는 GitHub Actions 워크플로우 테스트를 위한 데모 API 패키지입니다.

## 개요

이 패키지는 CI/CD 파이프라인에서 다양한 환경(dev, alpha, real)으로의 배포 프로세스를 테스트하기 위한 데모 API 패키지입니다.

> **목적**: 사내 프로덕션 워크플로우 적용 전, 안전하게 워크플로우 동작을 검증하고 테스트하기 위함입니다.

## Workflow 설명

### 트리거 조건

워크플로우는 다음 두 가지 방법으로 실행됩니다:

1. **수동 실행 (workflow_dispatch)**
   - GitHub Actions 탭에서 수동으로 워크플로우 실행
   - `dev` 또는 `alpha` 스테이지 선택 가능
   - 기본값: `dev`

2. **자동 실행 (workflow_run)**
   - `ci` 워크플로우가 성공적으로 완료된 후 자동 실행
   - `master` 브랜치에만 적용 (원하는 브랜치에 따라 변경 가능)
   - 기본 스테이지: `dev`

### 실행 조건

```yaml
if: |
  github.event_name == 'workflow_dispatch' || 
  (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success')
```

배포 job은 다음 조건에서만 실행됩니다:

- 수동 실행일 경우
- 또는 CI 워크플로우가 성공적으로 완료된 경우

## 배포 환경

### 지원 환경

| 환경  | API URL                       | 리전           | 사용 목적        |
| ----- | ----------------------------- | -------------- | ---------------- |
| dev   | https://api-dev.example.com   | ap-northeast-2 | 개발 환경        |
| alpha | https://api-alpha.example.com | ap-northeast-2 | 알파 테스트 환경 |
| real  | https://api.example.com       | ap-northeast-2 | 프로덕션 환경    |

### 배포 스크립트

```bash
# 개발 환경 배포
pnpm run deploy:dev

# 알파 환경 배포
pnpm run deploy:alpha

# 프로덕션 환경 배포
pnpm run deploy:real
```

## 사용 방법

### GitHub Actions에서 실행

**수동 실행:**

1. GitHub 저장소의 Actions 탭 이동
2. "Workflows Test" 워크플로우 선택
3. "Run workflow" 클릭
4. 배포할 스테이지 선택 (dev 또는 alpha)
5. "Run workflow" 버튼 클릭

**자동 실행:**

- `master` 브랜치에 푸시하고 CI가 성공하면 자동 실행

## 스크립트 구조

### deploy.js

```javascript
// 환경별 설정
const configs = {
  dev: {
    apiUrl: "https://api-dev.example.com",
    region: "ap-northeast-2",
  },
  alpha: {
    apiUrl: "https://api-alpha.example.com",
    region: "ap-northeast-2",
  },
  real: {
    apiUrl: "https://api.example.com",
    region: "ap-northeast-2",
  },
}
```

## 제한 사항

- `real` 환경은 워크플로우에서 자동 배포되지 않음 (안전 장치)
- 배포는 `dev`와 `alpha` 환경에만 허용됨

## 의존성

- `dotenv`: 환경 변수 관리
- `pnpm`: 패키지 관리

## 참고사항

이 패키지는 데모 목적으로 실제 배포를 수행하지 않습니다. 실제 배포 프로세스를 시뮬레이션하며, 워크플로우의 정상 작동 여부를 확인하기 위한 것입니다.
