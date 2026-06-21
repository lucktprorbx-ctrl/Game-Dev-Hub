# RoCheck — Roblox Studio Operations Hub

A full-stack dashboard for managing a Roblox game studio: team members, Kanban planning boards, calendar, notes, and Roblox group analytics.

**Tech stack:** React 19 + Vite + Tailwind v4 + shadcn/ui · Express 5 · PostgreSQL + Drizzle ORM · Roblox OAuth2 · react-i18next (EN/FR) · wouter

---

## Local Development — Windows + VSCode

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 22+ LTS | https://nodejs.org |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **PostgreSQL** | 16+ | https://www.postgresql.org/download/windows/ |
| **Git** | any | https://git-scm.com |

> **VSCode extensions recommended:** ESLint, Prettier, Tailwind CSS IntelliSense, Prisma (for .env syntax)

---

### 1 — Clone the repo

```powershell
git clone <repo-url>
cd roverse-dashboard
```

---

### 2 — Create the PostgreSQL database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE roverse_db;
```

---

### 3 — Set up environment variables

Copy the example file and fill in your values:

```powershell
copy .env.example artifacts\api-server\.env
```

Open `artifacts\api-server\.env` and set:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/roverse_db
ROBLOX_CLIENT_ID=your_client_id
ROBLOX_CLIENT_SECRET=your_client_secret
SESSION_SECRET=generate_a_long_random_string_here
PORT=8080
```

#### Get Roblox OAuth2 credentials

1. Go to https://create.roblox.com/dashboard/credentials
2. Create a new **OAuth 2.0** application
3. Add this redirect URI: `http://localhost:5000/api/auth/roblox/callback`
4. Copy the **Client ID** and **Client Secret**

#### Generate a session secret

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

### 4 — Install dependencies

```powershell
pnpm install
```

---

### 5 — Run database migrations

```powershell
pnpm --filter @workspace/db run push
```

---

### 6 — Start the servers

Open **two separate terminals** in VSCode (`Ctrl+Shift+\`` to open a new terminal):

**Terminal 1 — API server (port 8080):**

```powershell
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Dashboard (port 5000):**

```powershell
$env:PORT="5000"; $env:BASE_PATH="/"; $env:API_PORT="8080"; pnpm --filter @workspace/dashboard run dev
```

Then open **http://localhost:5000** in your browser.

> The Vite dev server automatically proxies `/api` calls to port 8080 when `REPL_ID` is not set (i.e. outside of Replit).

---

### VSCode launch configuration (optional)

Create `.vscode/launch.json` for one-click debugging:

```json
{
  "version": "0.2.0",
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["API Server", "Dashboard"]
    }
  ],
  "configurations": [
    {
      "name": "API Server",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/artifacts/api-server",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev"],
      "env": {
        "PORT": "8080"
      },
      "envFile": "${workspaceFolder}/artifacts/api-server/.env",
      "console": "integratedTerminal"
    },
    {
      "name": "Dashboard",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/artifacts/dashboard",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev"],
      "env": {
        "PORT": "5000",
        "BASE_PATH": "/",
        "API_PORT": "8080"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

---

### Project structure

```
/
├── artifacts/
│   ├── api-server/          # Express 5 + Drizzle ORM backend
│   │   └── src/
│   │       ├── app.ts       # Middleware (helmet, rate-limit, CORS, sessions)
│   │       ├── routes/      # auth, users, planning, games
│   │       └── index.ts
│   └── dashboard/           # React 19 + Vite frontend
│       └── src/
│           ├── pages/       # dashboard, planning, users, games, revenue
│           ├── components/  # layout, planning, ui (shadcn)
│           ├── contexts/    # AuthContext
│           └── lib/         # role-colors, utils
├── lib/
│   ├── db/                  # Drizzle schema + migrations
│   └── api-client-react/    # Auto-generated TanStack Query hooks
└── .env.example
```

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `PORT environment variable is required` | Make sure you set `$env:PORT="5000"` before running the dashboard |
| `ECONNREFUSED localhost:8080` | API server isn't running, check Terminal 1 |
| Roblox OAuth redirect mismatch | Verify the redirect URI in your Roblox app matches `http://localhost:5000/api/auth/roblox/callback` |
| Database connection error | Check `DATABASE_URL` in `artifacts/api-server/.env` and that PostgreSQL is running |
| `pnpm: command not found` | Run `npm install -g pnpm` first |

---

### Hardcoded authorized users (development)

The following Roblox user IDs are pre-authorized (see `artifacts/api-server/src/routes/auth.ts`):

- **Admin:** `454458772`, `1428066981`, `2001745284`
- **Collaborator:** `3080402841`, `9690401925`

To add yourself, add your Roblox numeric user ID to the appropriate array in `auth.ts`.
