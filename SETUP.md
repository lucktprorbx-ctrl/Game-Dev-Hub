# RoVerse Dashboard — Local Setup Guide

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20 LTS or higher | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org/download/windows/ |
| Git | any | https://git-scm.com |

---

## 1. Clone the repository

```bash
git clone https://github.com/lucktprorbx-ctrl/Game-Dev-Hub.git
cd Game-Dev-Hub
```

---

## 2. Install dependencies

```bash
pnpm install
```

---

## 3. Configure environment variables

Copy the example file and fill in your values:

**Windows (cmd)**
```cmd
copy .env.example .env
```

**Windows (PowerShell) / macOS / Linux**
```bash
cp .env.example .env
```

Then open `.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/roverse
ROBLOX_CLIENT_ID=your_client_id
ROBLOX_CLIENT_SECRET=your_client_secret
SESSION_SECRET=any_long_random_string
PORT=8080
BASE_PATH=/
```

### Create the PostgreSQL database

```sql
-- In psql or pgAdmin:
CREATE DATABASE roverse;
```

### Create a Roblox OAuth app

1. Go to https://create.roblox.com/dashboard/credentials
2. Create a new **OAuth 2.0** app
3. Add redirect URI: `http://localhost:8080/api/auth/roblox/callback`
4. Copy the **Client ID** and **Client Secret** into `.env`

---

## 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

---

## 5. Run the app

Open **two terminals**:

**Terminal 1 — API server** (port 8080)

*Windows (cmd):*
```cmd
set PORT=8080 && pnpm --filter @workspace/api-server run dev
```

*Windows (PowerShell):*
```powershell
$env:PORT="8080"; pnpm --filter @workspace/api-server run dev
```

*macOS / Linux:*
```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend** (port 5173)

*Windows (cmd):*
```cmd
set PORT=5173 && set BASE_PATH=/ && pnpm --filter @workspace/dashboard run dev
```

*Windows (PowerShell):*
```powershell
$env:PORT="5173"; $env:BASE_PATH="/"; pnpm --filter @workspace/dashboard run dev
```

*macOS / Linux:*
```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/dashboard run dev
```

Then open: **http://localhost:5173**

---

## 6. (Optional) Combined startup script

### Windows — `start-dev.bat`

```bat
@echo off
start "API Server" cmd /k "set PORT=8080 && pnpm --filter @workspace/api-server run dev"
timeout /t 5
start "Dashboard" cmd /k "set PORT=5173 && set BASE_PATH=/ && pnpm --filter @workspace/dashboard run dev"
echo Both servers starting...
```

### macOS / Linux — `start-dev.sh`

```bash
#!/bin/bash
PORT=8080 pnpm --filter @workspace/api-server run dev &
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/dashboard run dev
```

---

## Environment variable loading (optional)

To avoid setting env vars every time, you can use **dotenv-cli**:

```bash
npm install -g dotenv-cli

# Then run:
dotenv -- pnpm --filter @workspace/api-server run dev
```

Or copy `.env` values into your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| API | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Roblox OAuth 2.0 |
| i18n | react-i18next (EN / FR) |

---

## Roles & Access

Roles are assigned automatically based on Roblox ID at login:

| Role | Roblox IDs | Access |
|------|-----------|--------|
| Admin | 454458772, 1428066981, 2001745284 | Full dashboard |
| Collaborator | 3080402841, 9690401925 | Planning only |

To add more admins/collaborators, update the role logic in:
`artifacts/api-server/src/routes/auth.ts`

---

## Troubleshooting

**`PORT environment variable is required`**  
→ You forgot to set `PORT` before running. Use the commands in Step 5.

**`DATABASE_URL` errors**  
→ Make sure PostgreSQL is running and the database exists. Run `pnpm --filter @workspace/db run push`.

**OAuth callback error**  
→ Verify the redirect URI in your Roblox app matches exactly: `http://localhost:8080/api/auth/roblox/callback`

**`pnpm: command not found`**  
→ Run `npm install -g pnpm` first.
