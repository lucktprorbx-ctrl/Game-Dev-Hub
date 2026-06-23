# RoCheck — Roblox Studio Operations Hub

Dashboard de gestion pour studios Roblox : membres d'équipe, Kanban, calendrier, notes et analytics de groupe.

**Stack :** React 19 · Vite · Tailwind CSS v4 · shadcn/ui · Express 5 · PostgreSQL · Drizzle ORM · Roblox OAuth2 · react-i18next (EN/FR)

---

## Démarrage rapide — Docker (Windows & Linux)

La méthode la plus simple. Une seule commande, rien à installer sauf Docker.

### Prérequis

| Outil | Téléchargement |
|-------|---------------|
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ |
| **Git** | https://git-scm.com |

### Étapes

**1 — Cloner le projet**

```bash
git clone https://github.com/lucktprorbx-ctrl/Game-Dev-Hub.git
cd Game-Dev-Hub
```

**2 — Créer le fichier `.env`**

```bash
# Windows (cmd)
copy .env.example .env

# Windows (PowerShell) / macOS / Linux
cp .env.example .env
```

Ouvrir `.env` et renseigner les clés Roblox OAuth (voir [Obtenir les clés Roblox](#obtenir-les-clés-roblox-oauth2)) :

```env
DATABASE_URL=postgresql://rocheck:rocheck123@localhost:5432/rocheck
ROBLOX_CLIENT_ID=ton_client_id
ROBLOX_CLIENT_SECRET=ton_client_secret
ROBLOX_REDIRECT_URI=http://localhost:5000/api/auth/roblox/callback
SESSION_SECRET=une_chaine_aleatoire_longue
```

**3 — Lancer**

```bash
docker compose up
```

| URL | Description |
|-----|-------------|
| **http://localhost:5000** | Application |
| **http://localhost:8082** | Adminer — gestionnaire de base de données (comme phpMyAdmin) |

Pour arrêter : `Ctrl+C` puis `docker compose down`.

---

## Démarrage manuel — sans Docker (Windows / Linux)

### Prérequis

| Outil | Version | Téléchargement |
|-------|---------|---------------|
| **Node.js** | 20+ LTS | https://nodejs.org |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **PostgreSQL** | 16+ | https://www.postgresql.org/download/ |
| **Git** | any | https://git-scm.com |

### Étapes

**1 — Cloner et installer**

```bash
git clone https://github.com/lucktprorbx-ctrl/Game-Dev-Hub.git
cd Game-Dev-Hub
pnpm install
```

**2 — Créer la base de données PostgreSQL**

Dans psql ou pgAdmin :

```sql
CREATE DATABASE rocheck;
```

**3 — Créer le fichier `.env`**

```bash
cp .env.example .env   # ou: copy .env.example .env (Windows cmd)
```

Renseigner les valeurs dans `.env` :

```env
DATABASE_URL=postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/rocheck
ROBLOX_CLIENT_ID=ton_client_id
ROBLOX_CLIENT_SECRET=ton_client_secret
ROBLOX_REDIRECT_URI=http://localhost:5000/api/auth/roblox/callback
SESSION_SECRET=une_chaine_aleatoire_longue
```

Générer un `SESSION_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**4 — Appliquer le schéma de base de données**

```bash
pnpm --filter @workspace/db run push
```

**5 — Lancer les deux serveurs**

Ouvrir **deux terminaux** :

*Terminal 1 — API (port 8080) :*

```bash
# macOS / Linux
PORT=8080 pnpm --filter @workspace/api-server run dev

# Windows PowerShell
$env:PORT="8080"; pnpm --filter @workspace/api-server run dev

# Windows cmd
set PORT=8080 && pnpm --filter @workspace/api-server run dev
```

*Terminal 2 — Frontend (port 5000) :*

```bash
# macOS / Linux
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/dashboard run dev

# Windows PowerShell
$env:PORT="5000"; $env:BASE_PATH="/"; pnpm --filter @workspace/dashboard run dev

# Windows cmd
set PORT=5000 && set BASE_PATH=/ && pnpm --filter @workspace/dashboard run dev
```

Ouvrir **http://localhost:5000** dans le navigateur.

> Le proxy Vite redirige automatiquement les appels `/api` vers le port 8080.

---

## Obtenir les clés Roblox OAuth2

1. Aller sur https://create.roblox.com/dashboard/credentials
2. Créer une nouvelle application **OAuth 2.0**
3. Ajouter l'URI de redirection : `http://localhost:5000/api/auth/roblox/callback`
4. Copier le **Client ID** et le **Client Secret** dans `.env`

> En production, remplacer `http://localhost:5000` par ton domaine.

---

## Structure du projet

```
/
├── artifacts/
│   ├── api-server/          # Express 5 — routes, auth, middleware
│   │   └── src/
│   │       ├── app.ts       # CORS, helmet, rate-limit, cookie-parser
│   │       ├── routes/      # auth, users, games, planning, teams, groups
│   │       └── middlewares/ # requireAuth, requireAdmin
│   └── dashboard/           # React 19 + Vite — interface utilisateur
│       └── src/
│           ├── pages/       # Dashboard, Planning, Users, Games, Revenue
│           ├── components/  # Layout, Kanban, Calendar, shadcn/ui
│           └── contexts/    # AuthContext
├── lib/
│   ├── db/                  # Schéma Drizzle ORM + migrations
│   ├── api-spec/            # Spécification OpenAPI (source de vérité)
│   ├── api-client-react/    # Hooks TanStack Query générés automatiquement
│   └── api-zod/             # Schémas Zod générés automatiquement
├── docker-compose.yml       # PostgreSQL + Adminer + App
├── Dockerfile
└── .env.example
```

---

## Rôles et accès

Les rôles sont assignés automatiquement à la connexion selon l'ID Roblox :

| Rôle | IDs Roblox | Accès |
|------|-----------|-------|
| **Admin** | 454458772, 1428066981, 2001745284 | Dashboard complet |
| **Collaborator** | 3080402841, 9690401925 | Planning uniquement |

Pour ajouter un utilisateur : modifier les tableaux `HARDCODED_ADMINS` / `HARDCODED_COLLABORATORS` dans `artifacts/api-server/src/routes/auth.ts`.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `PORT environment variable is required` | Définir `PORT=5000` avant de lancer le dashboard |
| `ECONNREFUSED localhost:8080` | Le serveur API n'est pas démarré (Terminal 1) |
| Erreur redirect Roblox OAuth | Vérifier que l'URI de redirection dans ton app Roblox est exactement `http://localhost:5000/api/auth/roblox/callback` |
| Erreur de connexion à la DB | Vérifier `DATABASE_URL` dans `.env` et que PostgreSQL tourne |
| `pnpm: command not found` | Lancer `npm install -g pnpm` d'abord |
| Écran blanc sur localhost:5000 | Le serveur API (Terminal 1) doit tourner en même temps |
| Erreur esbuild sur Windows | Supprimer `node_modules` et relancer `pnpm install` |

---

## Commandes utiles

```bash
pnpm install                              # Installer les dépendances
pnpm --filter @workspace/db run push      # Appliquer le schéma DB
pnpm --filter @workspace/api-server run build  # Build du serveur API
pnpm run typecheck                        # Vérification TypeScript
docker compose up                         # Lancer avec Docker
docker compose down                       # Arrêter Docker
docker compose up --build                 # Reconstruire et lancer
```
