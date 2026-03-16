# Hostinger Git Auto Deploy Setup

This repository is configured with GitHub Actions auto-deploy using SSH.

## 1. Required Hostinger Setup

1. Enable SSH access for your Hostinger account.
2. Make sure these tools are available in SSH:
- `git`
- `php`
- `composer`
- `npm` (optional but needed if you build frontend on server)

## 2. Add GitHub Repository Secrets

Go to GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret.

Create these secrets:

- `HOSTINGER_HOST`
  - Example: `31.220.xxx.xxx`
- `HOSTINGER_USERNAME`
  - Example: `u123456789`
- `HOSTINGER_SSH_KEY`
  - Your private SSH key content (OpenSSH format)
- `HOSTINGER_SSH_PORT`
  - Usually `65002` on Hostinger
- `HOSTINGER_DEPLOY_PATH`
  - Example: `/home/u123456789/domains/himlayangpilipino.com/repo/Himlayan-Cemetery`
- `HOSTINGER_FRONTEND_PUBLIC_PATH`
  - Example: `/home/u123456789/domains/himlayangpilipino.com/public_html`
- `REACT_APP_API_URL`
  - Example: `https://api.himlayangpilipino.com`

## 3. First-Time Server Preparation

SSH to host and run once:

```bash
mkdir -p /home/USER/domains/DOMAIN/repo
```

Then make sure backend `.env` exists at:

- `/home/USER/domains/DOMAIN/repo/Himlayan-Cemetery/backend/.env`

Set production values in that `.env`:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://api.your-domain.com`
- `FRONTEND_URL=https://your-domain.com`
- DB credentials
- Mail credentials
- Xendit credentials

## 4. How Deploy Works

Workflow file:

- `.github/workflows/deploy-hostinger.yml`

On every push to `main`, it will:

1. SSH to Hostinger.
2. Clone repo on first run or pull latest changes.
3. Run backend install/update commands:
- `composer install --no-dev`
- `php artisan migrate --force`
- `php artisan optimize`
4. Build frontend with `npm run build`.
5. Copy frontend build output to `HOSTINGER_FRONTEND_PUBLIC_PATH`.

## 5. Trigger Manual Deploy

GitHub -> Actions -> "Deploy to Hostinger" -> Run workflow.

## 6. Notes

- Keep `.env` only on server, never commit it.
- If Node.js is not available on Hostinger SSH, frontend build step is skipped.
- In that case, switch to build-on-GitHub + upload artifact flow.
