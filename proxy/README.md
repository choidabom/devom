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

> 127.0.0.1의 80/443 포트가 이미 다른 프로그램(회사 프록시 등)에서 사용 중일 때, 127.0.0.2를 사용하면 포트 충돌을 피할 수 있다. 127.0.0.0/8 전체 대역이 loopback으로 사용 가능하므로, 필요하면 127.0.0.3, 127.0.0.4 등도 사용할 수 있다.
>
> 포트 충돌이 없다면 127.0.0.1을 사용해도 됩니다 (docker-compose.yml에서 포트 설정을 `80:80`, `443:443`으로 변경).

```bash
# 127.0.0.2 loopback alias 생성
sudo ifconfig lo0 alias 127.0.0.2 up

# /etc/hosts 파일에 추가
echo "127.0.0.2 local.devom.dev" | sudo tee -a /etc/hosts
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
127.0.0.2:443 (Docker Nginx)
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
- `local.devom.dev` → `127.0.0.2`로 변환

#### 3. TCP 연결

- 브라우저가 `127.0.0.2:443`으로 연결 시도
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

| 구성 요소                | 역할                                                      |
| ------------------------ | --------------------------------------------------------- |
| **127.0.0.2**            | 기본 loopback(127.0.0.1)과 분리된 별도 IP, 포트 충돌 방지 |
| **/etc/hosts**           | local.devom.dev 도메인을 127.0.0.2로 매핑                 |
| **mkcert**               | 로컬 개발용 신뢰할 수 있는 SSL 인증서 생성                |
| **Docker Nginx**         | HTTPS 종료 및 리버스 프록시 역할                          |
| **host.docker.internal** | Docker 컨테이너가 호스트 머신에 접근하기 위한 특수 DNS    |
| **Next.js Dev Server**   | 실제 애플리케이션 (localhost:3000)                        |

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
