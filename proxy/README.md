# Nginx Proxy - 로컬 HTTPS 개발 환경

로컬 개발 환경에서 HTTPS + 단일 도메인으로 모든 앱을 통합하는 Nginx 리버스 프록시

## 개요

**Before:** : `http://localhost:3000`

**After:** : `https://local.devom.dev`

- HTTPS 필수 기능 테스트 가능 (OAuth, Service Worker 등)
- 실제 배포 환경과 동일한 조건
- 포트 번호 외울 필요 없점

## 빠른 시작

### 1. 사전 준비

```bash
brew install mkcert
docker --version
```

### 2. SSL 인증서 생성

```bash
cd proxy/ssl
mkcert -install  # 최초 1회만
mkcert local.devom.dev
```

### 3. 도메인 설정

> 127.0.0.1의 80/443 포트가 이미 다른 프로그램(회사 프록시 등)에서 사용 중일 때는 포트 충돌이 발생할 수 있다. 그 경우 다른 포트(8080, 8443 등)를 사용하거나, 127.0.0.2와 같은 다른 loopback IP를 사용할 수 있다.

```bash
# /etc/hosts 파일에 추가
echo "127.0.0.1 local.devom.dev" | sudo tee -a /etc/hosts
```

### 4. 프록시 시작

```bash
cd proxy
docker compose up -d
```

### 5. Next.js 개발 서버 시작

```bash
pnpm dev
```

### 6. 브라우저 접속

```
https://local.devom.dev
```

## 동작 플로우

### 전체 흐름도

```
브라우저 (https://local.devom.dev)
    ↓
    ① DNS 조회: /etc/hosts
    ↓
127.0.0.1:443 (Docker Nginx)
    ↓
    ② SSL/TLS Handshake
    ↓
Nginx (리버스 프록시)
    ↓
    ③ upstream 라우팅
    ↓
host.docker.internal:3000
    ↓
    ④ 호스트 머신의 localhost:3000
    ↓
Next.js 개발 서버 (Archive App)
```

### 단계별 상세 설명

#### 1. 브라우저 요청

사용자가 `https://local.devom.dev` 입력

#### 2. DNS 해석

- `/etc/hosts` 파일 조회
- `local.devom.dev` → `127.0.0.1`로 변환

#### 3. TCP 연결

- 브라우저가 `127.0.0.1:443`으로 연결 시도
- Docker Nginx 컨테이너가 해당 포트를 리스닝

#### 4. SSL/TLS Handshake

- Nginx가 `/etc/nginx/ssl/local.devom.dev.pem` 인증서 제시
- 브라우저가 mkcert CA로 인증서 검증 (신뢰됨)
- 암호화된 HTTPS 연결 수립

#### 5. HTTP 요청 프록시

- Nginx가 `nginx.conf`의 http 블록에서 `conf.d/*.conf` 파일 로드
- `conf.d/nginx.dev.conf` 설정 읽기
- `server_name local.devom.dev` 블록 매칭
- `location /` → `proxy_pass http://archive_app`로 전달

#### 6. Docker → Host 통신

- `upstream archive_app`에서 `host.docker.internal:3000` 조회
- Docker의 특수 DNS 이름: 호스트 머신의 `localhost`를 가리킴
- 컨테이너 내부에서 호스트의 3000번 포트로 요청 전달

#### 7. Next.js 처리

- `localhost:3000`에서 실행 중인 Archive 앱이 요청 수신
- React 렌더링 및 응답 생성
- HMR을 위한 WebSocket 연결도 동일 경로로 프록시됨

#### 8. 응답 반환

- Next.js → Nginx → 브라우저 순으로 응답 전달
- HTTPS로 암호화되어 전송

### 핵심 구성 요소

| 구성 요소                | 역할                                                   |
| ------------------------ | ------------------------------------------------------ |
| **127.0.0.1**            | 기본 loopback IP, 로컬 개발 환경                       |
| **/etc/hosts**           | local.devom.dev 도메인을 127.0.0.1로 매핑              |
| **mkcert**               | 로컬 개발용 신뢰할 수 있는 SSL 인증서 생성             |
| **Docker Nginx**         | HTTPS 종료 및 리버스 프록시 역할                       |
| **host.docker.internal** | Docker 컨테이너가 호스트 머신에 접근하기 위한 특수 DNS |
| **Next.js Dev Server**   | 실제 애플리케이션 (localhost:3000)                     |

## 디렉토리 구조

```
proxy/
├── ssl/              # SSL 인증서 (mkcert로 생성)
├── conf.d/           # Nginx 서버 블록 설정
│   └── nginx.dev.conf  # 개발 환경 리버스 프록시 설정
├── nginx.conf        # Nginx 메인 설정 (events, http 블록)
├── docker-compose.yml  # Docker Compose 설정 (포트, 볼륨 마운트)
└── Dockerfile          # Nginx 이미지 빌드 설정
```
