# @devom/screenshot-updater

This package automates blog screenshot capture and updating of blog screenshots using a GitHub Actions workflow.

## Motivation

Initially, I embedded my blog into the app using an iframe to simulate an actual browser experience. While it worked technically, this approach conflicted with Google AdSense policies, which led to ad blocking—and ultimately, a loss of valuable ad revenue.

As a workaround, I decided to present the blog as a static image to preserve the look and feel. However, manually capturing and updating screenshots every time the blog content changed proved inefficient and error-prone.

To resolve this, I created a GitHub Actions workflow that fully automates the screenshot capturing process. It captures the latest blog view, replaces the static image in the app directory, and commits the change—all without manual intervention.

## Features

- Web page screenshot capture using Puppeteer
- Automated screenshot updates via GitHub Actions

## GitHub Actions

This package runs automatically through GitHub Actions. The workflow performs the following tasks:

1. Sets up Node.js and pnpm environment
2. Installs all project dependencies
3. Executes the screenshot capture script
4. Verifies the image file (blog.png) exists
5. Moves the file to the target public directory in the app
6. Commits the update with a timestamped message
7. Pushes the commit using a secure token

## Workflow Configuration (update-screenshot.yml)

```yaml
// .github/workflows/blog-screenshot-automation.yml
name: Blog Screenshot Automation

permissions:
  actions: write
  contents: write

on:
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  capture-and-update:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/screenshot-updater

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: |
          cd ../..
          pnpm install --frozen-lockfile
          cd packages/screenshot-updater

      - name: Validate screenshot updater setup
        run: |
          if [ ! -f "package.json" ]; then
            echo "Error: package.json not found in screenshot-updater directory"
            exit 1
          fi
          
          if ! pnpm list | grep -q "screenshot"; then
            echo "Warning: No screenshot-related packages found"
          fi

      - name: Capture screenshot
        run: |
          echo "Starting screenshot capture..."
          pnpm start

      - name: Verify and validate screenshot
        run: |
          ls -lah
          
          if [ ! -f "blog.png" ]; then
            echo "Error: blog.png not found!"
            exit 1
          fi

      - name: Move screenshots to blog directory
        run: |
          mv blog.png ../../apps/archive/public/image/
          ls -lah ../../apps/archive/public/image/

      - name: Commit and push changes
        run: |
          git config --global user.name 'GitHub Actions Bot'
          git config --global user.email 'actions@github.com'
          git add ../../apps/archive/public/image/blog.png
          git commit -m "add: update blog screenshot ($(date +'%Y-%m-%d'))"
          git push 
        env:
          GITHUB_TOKEN: ${{ secrets.TOKEN }}
```

## Deployment Workflow (deploy.yml)

```yaml
// .github/workflows/deploy.yml

...

on:
  workflow_dispatch:
  push:
    branches: 
      - master
    paths: 
      - "apps/archive/**"
      - "apps/todolist/**"
      - "packages/utils/**"
  workflow_run:
    workflows: 
      - "Blog Screenshot Automation"
    types:
      - completed
    branches:
      - master

```

### Workflow Explanation
The workflow_run setting triggers a workflow when another workflow completes. In this case, the deployment workflow is triggered after the Blog Screenshot Automation workflow completes.

- `workflows: - "Blog Screenshot Automation"`: Specifies that the deployment workflow will be triggered after the Blog Screenshot Automation workflow completes.

- `types: - completed`: Ensures the deployment workflow runs regardless of whether the Blog Screenshot Automation workflow succeeds or fails.
`
- `branches: - master`: Limits the trigger to changes pushed to the master branch.

This ensures that after the blog screenshot is updated, the deployment workflow will automatically be triggered.

## Dependencies

- puppeteer: web page screenshot capture
- dotenv: environment variable management
- tsx: typeScript execution environment
- typescript: type checking and compilation