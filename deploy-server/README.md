# Deploy Server

> Automated branch-based deployment and PR preview environments

A self-hosted deployment automation server that provides GitHub-integrated preview environments for every branch and pull request.

## Features

- 🚀 **Automatic deployments** triggered by GitHub webhooks
- 🔒 **Secure webhook verification** with HMAC SHA256
- 🐳 **Docker-based isolation** for each deployment
- 🌐 **Dynamic subdomain routing** via Traefik
- 📦 **Build queue management** to prevent resource overload
- 🔄 **Automatic cleanup** when PRs are closed

## Architecture

```
GitHub Push/PR → Webhook → Deploy Server
                              ↓
                    1. Verify HMAC signature
                    2. Clone repository
                    3. Build project (pnpm)
                    4. Build Docker image
                    5. Run container
                              ↓
                          Traefik
                              ↓
                     http://branch.domain
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker 27+
- Git with SSH key configured

### 1. Install Dependencies

```bash
cd deploy-server
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set required variables:

```bash
# Required
GITHUB_WEBHOOK_SECRET=your-secret-here
REPO_SSH_URL=git@github.com:your-org/your-repo.git

# Recommended
BASE_DOMAIN=localhost  # or your domain
WORK_DIR=/tmp/deploy/workspace
```

### 3. Start Traefik

```bash
docker-compose up -d traefik
```

Traefik dashboard: http://localhost:8080

### 4. Start Deploy Server

```bash
# Development mode with hot reload
pnpm dev

# Or production mode
pnpm build
pnpm start
```

Server runs at: http://localhost:3000

### 5. Configure GitHub Webhook

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Configure:
   - **Payload URL**: `https://your-server.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: Same as `GITHUB_WEBHOOK_SECRET` in `.env`
   - **Events**: Select `push` and `pull_request`
4. Save webhook

## Testing Locally

Use the provided test script to simulate webhooks:

```bash
# Test push event
node test/send-webhook.mjs push

# Test PR opened
node test/send-webhook.mjs pr-open

# Test PR closed
node test/send-webhook.mjs pr-close

# Health check
node test/send-webhook.mjs health
```

## Environment Variables

| Variable                | Required | Default               | Description                    |
| ----------------------- | -------- | --------------------- | ------------------------------ |
| GITHUB_WEBHOOK_SECRET   | ✅       | -                     | GitHub webhook secret          |
| REPO_SSH_URL            | ✅       | -                     | Git repository SSH URL         |
| BASE_DOMAIN             | -        | localhost             | Base domain for deployments    |
| WORK_DIR                | -        | /tmp/deploy/workspace | Build workspace directory      |
| PORT                    | -        | 3000                  | Server port                    |
| BUILD_TIMEOUT           | -        | 600000                | Build timeout (ms)             |
| MAX_CONCURRENT_BUILDS   | -        | 3                     | Max concurrent builds          |
| DEFAULT_BRANCH          | -        | master                | Default branch name            |
| ALLOWED_BRANCH_REGEX    | -        | ^(feature\|fix\|...)  | Branch filter regex            |
| DOCKER_NETWORK_NAME     | -        | deploy-network        | Docker network name            |

## How It Works

### Push Event Flow

1. Developer pushes to `feature/login` branch
2. GitHub sends webhook to deploy server
3. Server verifies HMAC signature
4. Server checks if branch matches filter regex
5. Server adds job to build queue
6. Server clones repository
7. Server runs `pnpm install && pnpm build`
8. Server builds Docker image with Nginx
9. Server starts container with Traefik labels
10. Container accessible at `http://feature-login.localhost`

### PR Preview Flow

1. Developer opens PR #123
2. GitHub sends webhook
3. Server deploys to `http://pr-123.localhost`
4. On PR update: rebuild and redeploy
5. On PR close: stop and remove container

## Subdomain Mapping

| Branch/PR         | Subdomain                    |
| ----------------- | ---------------------------- |
| `master`          | `localhost` (base domain)    |
| `feature/login`   | `feature-login.localhost`    |
| `fix/bug-123`     | `fix-bug-123.localhost`      |
| PR #123           | `pr-123.localhost`           |

## API Endpoints

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "message": "Deploy Server is running! 🚀"
}
```

### `GET /health`

Detailed health status.

**Response:**
```json
{
  "status": "ok",
  "queueSize": 0,
  "pending": 0
}
```

### `POST /webhook`

GitHub webhook endpoint.

**Headers:**
- `X-Hub-Signature-256`: HMAC SHA256 signature
- `X-GitHub-Event`: Event type (`push` or `pull_request`)
- `X-GitHub-Delivery`: Unique delivery ID

**Response:**
```json
{
  "status": "received"
}
```

## Project Structure

```
deploy-server/
├── src/
│   ├── server.ts           # Main server
│   ├── config.ts           # Configuration loader
│   ├── types.ts            # TypeScript types
│   └── utils/
│       ├── webhook.ts      # Webhook verification
│       ├── git.ts          # Git clone & build
│       ├── docker.ts       # Docker operations
│       └── logger.ts       # Winston logger
├── test/
│   ├── fixtures/           # Test webhook payloads
│   └── send-webhook.mjs    # Test script
├── docker-compose.yml      # Traefik configuration
├── .env.example            # Environment template
└── README.md               # This file
```

## Troubleshooting

### Build fails with "No build output directory found"

Ensure your project outputs to one of these directories:
- `dist`
- `.next`
- `build`
- `out`

### Container not accessible

1. Check if Traefik is running: `docker ps | grep traefik`
2. Check container logs: `docker logs <container-name>`
3. Verify Docker network: `docker network inspect deploy-network`

### Webhook signature verification fails

1. Ensure `GITHUB_WEBHOOK_SECRET` matches GitHub webhook secret
2. Check server logs for signature mismatch details

## Production Deployment

### Using systemd

Create `/etc/systemd/system/deploy-server.service`:

```ini
[Unit]
Description=Deploy Server
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/deploy-server
ExecStart=/usr/bin/node dist/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable deploy-server
sudo systemctl start deploy-server
```

### Using PM2

```bash
pm2 start dist/server.js --name deploy-server
pm2 save
pm2 startup
```

## Security Considerations

- Always use HTTPS in production
- Keep `GITHUB_WEBHOOK_SECRET` secure
- Configure firewall to allow only GitHub webhook IPs
- Use SSH keys for Git authentication
- Set resource limits on Docker containers

## Roadmap

- [ ] GitHub Status API integration
- [ ] Slack/Discord notifications
- [ ] Build artifact caching
- [ ] Deployment history tracking
- [ ] Web UI for deployment management
- [ ] Multi-repository support

## License

MIT
