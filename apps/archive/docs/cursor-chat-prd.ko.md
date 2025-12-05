# Cursor Chat PRD - Archive 앱 통합

## 개요

[cursor-chat](https://github.com/jackyzha0/cursor-chat)에서 영감을 받아 Yorkie-js-sdk를 사용하여 Archive 앱에 실시간 협업 커서 채팅 기능을 구현합니다. 이 기능은 여러 사용자가 서로의 커서를 보고 실시간으로 채팅 메시지를 교환할 수 있는 "디지털 공존 + 프레즌스"를 가능하게 합니다.

## 배경

원본 cursor-chat 라이브러리(63.4kB)는 Yjs와 perfect-cursors를 사용하여 가벼운 실시간 협업을 제공합니다. 우리의 구현은 동일한 직관적인 UX를 유지하면서 Yorkie-js-sdk를 활용하여 더 강력한 CRDT 기반 동기화를 제공합니다.

**참고 자료:**

- 저장소: https://github.com/jackyzha0/cursor-chat
- 데모: https://jackyzha0.github.io/cursor-chat/

## 목표

1. **주요 목표**: Archive 데스크톱 환경을 위한 재미있고 가벼운 프레즌스 기능 만들기
2. **부차 목표**: Yorkie를 사용한 실시간 협업 기능 시연
3. **삼차 목표**: macOS 스타일 UI에 멀티플레이어 상호작용 추가

## 비목표

- 프로덕션급 확장성 (실험적/재미용)
- 복잡한 채팅 기능 (스레딩, 히스토리, 반응)
- 모바일/터치 지원 (데스크톱 중심)
- 인증/사용자 관리 (익명 사용자)

## 사용자 경험

### 핵심 상호작용

1. **커서 프레즌스**
   - 사용자는 다른 접속 중인 사용자의 커서를 실시간으로 봄
   - 각 커서는 고유한 색상과 사용자 라벨을 가짐
   - 스프링 물리를 사용한 부드러운 애니메이션 (Framer Motion)
   - 사용자 연결 해제 시 커서가 사라짐

2. **채팅 활성화**
   - `/` 키를 눌러 커서 위치에 채팅 입력창 열기
   - **입력창 위치가 열릴 때 고정됨** (타이핑할 때 마우스 불필요)
   - `Esc`를 눌러 전송하지 않고 취소
   - `Enter`를 눌러 메시지 전송

3. **메시지 표시**
   - 메시지가 발신자의 커서 근처에 말풍선으로 표시됨
   - 5초 후 자동으로 사라짐
   - 페이드 인/아웃 애니메이션
   - 메시지당 최대 100자 지원

4. **시각적 디자인**
   - 미니멀하고 방해받지 않는 디자인
   - Archive의 macOS 스타일 미학과 일관성 유지
   - 라이트/다크 모드 지원
   - 창 위에 나타나도록 높은 z-index

5. **사용자 수 표시**
   - 좌측 하단에 온라인 사용자 수 표시
   - "X명 온라인" 또는 "혼자 있어요" 메시지 표시
   - 은은하고 방해받지 않는 디자인
   - 사용자 입장/퇴장 시 실시간 업데이트

### 사용자 플로우

```
1. 사용자가 Archive 앱 로드
   → YorkieProvider가 연결 초기화
   → 사용자에게 랜덤 색상 + 이름 할당

2. 사용자가 마우스를 움직임
   → 커서 위치가 다른 사용자들에게 브로드캐스트됨
   → 다른 사용자의 커서가 부드럽게 렌더링됨

3. 사용자가 '/' 키를 누름
   → 커서 위치에 채팅 입력창이 나타남
   → **입력창 위치가 해당 위치에 고정됨**
   → 포커스가 자동으로 입력창에 설정됨

4. 사용자가 메시지를 입력함
   → 글자 수 제한: 100자
   → 실시간 입력 검증

5. 사용자가 Enter 키를 누름
   → 메시지가 Yorkie를 통해 브로드캐스트됨
   → 커서에 말풍선이 나타남
   → 5초 후 자동으로 사라짐

6. 사용자가 Esc 키를 누름
   → 전송하지 않고 입력창이 닫힘
   → 일반 커서 모드로 돌아감
```

## 기술 아키텍처

### 기술 스택

- **Yorkie-js-sdk** (^0.6.0): 실시간 CRDT 동기화
- **Framer Motion** (^12.23.24): 스프링 물리를 사용한 커서 애니메이션
- **React 19**: UI 컴포넌트
- **Next.js 16**: 프레임워크 (이미 사용 중)
- **Tailwind CSS**: 스타일링

### 컴포넌트 구조

```
src/
├── context/
│   └── YorkieContext.tsx          # Yorkie 클라이언트 및 문서 관리
├── components/
│   └── cursorChat/
│       ├── CursorChat.tsx         # 메인 컴포넌트, 입력 처리
│       ├── Cursor.tsx             # 개별 커서 + 메시지 말풍선
│       └── UserCount.tsx          # 온라인 사용자 수 표시
└── components/desktop/
    └── Desktop.tsx                # 통합 지점
```

### 데이터 모델 (Yorkie Presence)

```typescript
interface Presence {
  name: string // 예: "User a3f2"
  color: string // 16진수 색상 (8가지 프리셋)
  cursor?: {
    x: number // 클라이언트 X 좌표
    y: number // 클라이언트 Y 좌표
  }
  message?: string // 현재 메시지 (삭제 시 undefined)
  messageTimestamp?: number // 자동 삭제 타이밍용
}
```

### 상태 관리

**YorkieProvider Context:**

- `client`: Yorkie Client 인스턴스
- `doc`: Presence 타입을 가진 Yorkie Document
- `presences`: 모든 접속 중인 사용자의 Map<string, Presence>
- `updatePresence()`: 자신의 presence를 업데이트하는 함수

**CursorChat 컴포넌트 상태:**

- `chatOpen`: 입력창 표시 여부 Boolean
- `message`: 현재 입력 값
- `cursorPosition`: 자신의 커서 { x, y }
- `lockedPosition`: 채팅이 열릴 때 고정된 입력 위치 { x, y }
- `onlineCount`: 접속 중인 사용자 수 (presences.size + 1)

### 이벤트 처리

1. **마우스 움직임**
   - 윈도우 레벨 `mousemove` 리스너
   - 쓰로틀: 쓰로틀링 없음 (부드러운 업데이트)
   - 로컬 상태 + Yorkie presence 업데이트

2. **키보드 단축키**
   - `/` 키: 채팅 열기 (기본 동작 방지)
   - `Esc` 키: 채팅 닫기, 메시지 지우기
   - `Enter` 키: 메시지 제출 (폼 제출)

3. **Presence 업데이트**
   - Yorkie `presence` 이벤트 구독
   - 새로운 presence 맵으로 React 상태 업데이트
   - Cursor 컴포넌트 리렌더링 트리거

### 성능 고려사항

1. **커서 애니메이션**
   - Framer Motion의 `useSpring`을 사용한 부드러운 보간
   - 스프링 설정: `{ damping: 30, stiffness: 300, mass: 0.5 }`
   - GPU 가속 트랜스폼

2. **리렌더링 최적화**
   - 필요시 커서 컴포넌트 메모이제이션
   - 마우스 추적과 키보드 처리 분리 (다른 useEffect 훅)

3. **네트워크 효율성**
   - Yorkie가 배칭/충돌 해결 처리
   - 커스텀 쓰로틀링 불필요 (CRDT가 처리)

## 구현 세부사항

### Phase 1: 핵심 인프라 ✅ (완료)

- [x] yorkie-js-sdk 의존성 설치
- [x] YorkieProvider context 생성
- [x] Yorkie 클라이언트 연결 설정
- [x] presence 구독 구현
- [x] 환경 변수 설정

### Phase 2: 커서 렌더링 ✅ (완료)

- [x] Cursor 컴포넌트 생성
- [x] 부드러운 커서 애니메이션 구현 (스프링 물리)
- [x] 색상 코딩된 사용자 이름 라벨 추가
- [x] 커스텀 SVG 커서 아이콘
- [x] 커서 입장/퇴장 처리 (presence 변경)

### Phase 3: 채팅 입력 ✅ (완료)

- [x] CursorChat 컴포넌트 생성
- [x] `/` 키 핸들러로 입력창 열기 구현
- [x] ~~입력창이 커서 위치를 따라다니게 하기~~ **열릴 때 위치 고정**
- [x] `Esc`로 닫기/취소 추가
- [x] Enter 키로 폼 제출
- [x] 글자 수 제한 (100자)

### Phase 4: 메시지 말풍선 ✅ (완료)

- [x] 커서 근처에 메시지 말풍선 렌더링
- [x] 페이드 인 애니메이션
- [x] 5초 후 자동 삭제
- [x] presence에서 메시지 지우기

### Phase 5: 다듬기 & 버그 수정 🔧 (진행 중)

- [x] 입력창 가시성을 위한 z-index 수정
- [x] 입력창 스타일 개선 (테두리, 그림자, 색상)
- [x] ~~채팅 입력 중 커서 추적 수정~~ **입력 위치 고정으로 대체**
- [ ] 채팅이 열릴 때 입력 위치 고정 구현
- [ ] UserCount 컴포넌트 생성
- [ ] UI에 사용자 수 표시 추가
- [ ] 여러 브라우저 탭으로 테스트
- [ ] 다크 모드 호환성 확인
- [ ] 엣지 케이스 처리 (빠른 열기/닫기 등)

### Phase 6: 문서화 & 정리

- [ ] 인라인 코드 주석 추가
- [ ] .env.example에 명확한 지침으로 업데이트
- [ ] CLAUDE.md에 cursor-chat 섹션 추가
- [ ] 선택사항: UI에 사용 지침 추가 (도움말 툴팁)

## 설정

### 환경 변수

```bash
# Yorkie 연결에 필요
YORKIE_API_KEY=<your-api-key>
```

### 커스터마이징 옵션

**색상 팔레트** (8가지 색상):

```typescript
const colors = [
  "#FF6B6B", // 빨강
  "#4ECDC4", // 청록
  "#45B7D1", // 파랑
  "#FFA07A", // 연한 연어색
  "#98D8C8", // 민트
  "#F7DC6F", // 노랑
  "#BB8FCE", // 보라
  "#85C1E2", // 하늘색
]
```

**타이밍 상수**:

- 메시지 자동 삭제: 5000ms
- 입력 포커스 지연: 0ms (즉시)
- 스프링 애니메이션 설정: Cursor.tsx에서 커스터마이징 가능

**Z-Index 레이어**:

- 커서: `z-40`
- 채팅 입력창: `z-[9999]`
- 사용자 수: `z-50`
- 데스크톱 창: `z-10` ~ `z-30` 범위

**사용자 수 표시**:

- 위치: 좌측 하단 (가장자리에서 16px)
- 텍스트 형식:
  - 1명: "혼자 있어요"
  - 2명: "2명 온라인"
  - 3명 이상: "X명 온라인"
- 스타일: 작고 은은한 텍스트, 배경 블러

## 알려진 이슈 & 제한사항

### 현재 구현

1. ~~**입력창 이동**: 채팅 입력창이 커서를 따라다님 (타이핑 중 방해될 수 있음)~~
   - **✅ 해결됨**: 채팅이 열릴 때 입력 위치 고정

2. **자신의 커서 없음**: 사용자는 자신의 커서/이름을 볼 수 없음
   - **디자인 결정**: 혼잡함을 줄이기 위해 의도적으로 제거

3. **메시지 히스토리 없음**: 메시지가 5초 후 사라짐
   - **디자인 결정**: 가볍고 일시적으로 유지

4. **익명만 가능**: 사용자 인증 없음
   - **디자인 결정**: 재미있고 실험적인 기능

### 브라우저 호환성

- **테스트됨**: 최신 Chrome, Firefox, Safari
- **지원 안 함**: 모바일 브라우저, IE11
- **요구사항**: ES6+, WebRTC (Yorkie용)

## 성공 지표

실험적 기능이므로 성공은 정성적으로 측정됩니다:

1. **기능성**: 모든 핵심 상호작용이 부드럽게 작동
2. **성능**: 커서 움직임에서 눈에 띄는 지연 없음
3. **UX**: 재미있고 방해받지 않는 느낌
4. **안정성**: 충돌이나 콘솔 오류 없음
5. **미학**: Archive의 시각적 디자인과 일치

## 향후 개선사항 (선택사항)

### V2 기능 (현재 범위 외)

1. **커서 커스터마이징**
   - 사용자가 선택한 색상
   - 커스텀 사용자 이름
   - 이모지 반응

2. **향상된 메시지**
   - 마크다운 지원
   - 링크 미리보기
   - 이모지 선택기

3. **프레즌스 인식**
   - 사용자 목록 사이드바
   - ~~"X명 온라인" 카운터~~ **✅ V1에 추가됨**
   - 포커스/idle 감지

4. **룸 관리**
   - 여러 룸 (애플리케이션 창별?)
   - 비공개/공개 룸
   - 초대 링크

5. **영속성**
   - 메시지 히스토리 (최근 10개 메시지?)
   - 사용자 환경설정 (localStorage)

## 디자인 결정사항

### ✅ 해결됨

1. **채팅 입력 위치 고정**
   - **결정**: 채팅이 열릴 때 위치 고정
   - **근거**: 사용자는 일반적으로 타이핑 중 마우스를 움직이지 않음
   - **상태**: 구현 승인됨

2. **사용자 수 표시**
   - **결정**: 좌측 하단에 추가
   - **근거**: UI를 혼잡하게 하지 않으면서 인식 제공
   - **상태**: 구현 승인됨

### 🤔 미해결 질문

1. **기존 데스크톱 앱과의 통합?**
   - 각 창(Blog, Docs)이 자체 cursor-chat 룸을 가져야 할까?
   - 아니면 전체 데스크톱에 대한 하나의 글로벌 룸?
   - **현재**: 전체 데스크톱에 대한 하나의 글로벌 룸

2. **Rate limiting?**
   - 메시지 전송을 쓰로틀해야 할까?
   - **현재**: 제한 없음 (신뢰 기반)
   - **고려사항**: 스팸이 문제가 되면 추가

## 참고 자료

- [cursor-chat 저장소](https://github.com/jackyzha0/cursor-chat)
- [cursor-chat 데모](https://jackyzha0.github.io/cursor-chat/)
- [Yorkie 문서](https://yorkie.dev)
- [Yjs 문서](https://yjs.dev) (원본 구현)
- [perfect-cursors 라이브러리](https://github.com/steveruizok/perfect-cursors)

## 부록: API 참조

### YorkieContext

```typescript
// 사용법
const { client, doc, presences, updatePresence } = useYorkie()

// Presence 업데이트
updatePresence({
  cursor: { x: 100, y: 200 },
  message: "안녕하세요!",
  messageTimestamp: Date.now(),
})

// 메시지 지우기
updatePresence({
  message: undefined,
  messageTimestamp: undefined,
})
```

### CursorChat 컴포넌트

```typescript
// Desktop 컴포넌트에 마운트
<YorkieProvider>
  <ApplicationProvider>
    <DesktopContent />
  </ApplicationProvider>
</YorkieProvider>

// DesktopContent에서
<CursorChat />
```

### 키보드 단축키

| 키      | 동작             |
| ------- | ---------------- |
| `/`     | 채팅 입력창 열기 |
| `Esc`   | 채팅 입력창 닫기 |
| `Enter` | 메시지 전송      |

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-05
**상태**: 구현 진행 중 (Phase 5)
