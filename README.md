# ARAL System

ARAL System is a fullstack MERN (MongoDB, Express, React, TypeScript) educational platform designed for Philippine DepEd (Department of Education) schools to track learner profiles, manage teacher assignments, and monitor reading intervention programs (ARAL).

**Features:**

- **4 User Roles:** Super Admin, School Head, Teacher, Learner
- **School Management:** Register, activate, and suspend schools with unique school codes
- **Teacher Management:** Assign teachers to grade levels, generate login PINs
- **Learner Tracking:** Register learners, flag for ARAL intervention, track reading levels
- **ARAL Dashboard:** Document intervention details, absenteeism patterns, and assessments
- **Attendance System:** Weekly click-to-toggle attendance tracking
- **Role-Based Access:** Strict gated workflows with first-time login password setup

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, Recharts, Wouter |
| Backend | Express 5, TypeScript, Mongoose, esbuild |
| Database | MongoDB 7.0+ |
| Validation | Zod |
| Auth | JWT Bearer tokens (localStorage) |
| Package Manager | pnpm workspaces |

---

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express API server (port 8080)
│   │   ├── src/
│   │   │   ├── routes/      # All API route handlers
│   │   │   ├── models/      # Mongoose schemas
│   │   │   ├── middlewares/ # auth.ts (authenticate, requireRole)
│   │   │   ├── lib/         # jwt.ts, mongodb.ts, logger.ts
│   │   │   ├── seed.ts      # Seeds default super admin
│   │   │   └── index.ts     # Entry point
│   │   └── dist/            # Production build output
│   └── aral-system/         # React frontend (port 3000)
│       ├── src/
│       │   ├── pages/       # All page components
│       │   ├── components/  # UI components + layout
│       │   ├── lib/         # auth.tsx (AuthProvider + useAuth)
│       │   └── App.tsx      # Routing
│       └── dist/            # Production build output
├── lib/
│   ├── api-spec/            # OpenAPI YAML spec + Orval codegen config
│   ├── api-zod/             # Zod schemas (generated from OpenAPI)
│   └── api-client-react/    # React Query hooks (generated from OpenAPI)
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # pnpm workspace definition
├── tsconfig.json           # Root TypeScript project references
├── tsconfig.base.json      # Shared TS compiler options
└── .env.example            # Example environment variables
```

---

## Prerequisites

1. **Node.js** 20+ (LTS recommended)
2. **pnpm** 10+ — [Install pnpm](https://pnpm.io/installation)
3. **MongoDB** 7.0+ — can be local or remote (MongoDB Atlas)

---

## Installation & Setup

### 1. Clone / Download the Project

If you downloaded from Replit, extract the ZIP file and open the folder in VS Code.

```bash
cd aral-system
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all workspace packages using pnpm's workspace linkage.

### 3. Set Up Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Edit `.env` in the root (or per artifact) with your own values:

```bash
# Backend
PORT=8080
MONGODB_URI=mongodb://localhost:27017/aral_system
JWT_SECRET=your_super_random_secret_key_here

# Frontend
FRONTEND_PORT=3000
BASE_PATH=/
```

**Important:**

- `MONGODB_URI` — use your MongoDB connection string (local or Atlas)
- `JWT_SECRET` — generate a strong random string (e.g., `openssl rand -base64 48`)
- `BASE_PATH` — set to `/` for most deployments, or a subpath if serving under a directory

### 4. Start MongoDB (if running locally)

**Option A: MongoDB installed locally**
```bash
mongod --dbpath /data/db --port 27017
```

**Option B: Docker**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

**Option C: MongoDB Atlas** 
Just use your Atlas connection string in `MONGODB_URI`.

---

## Running Locally

### Start the API Server

```bash
# Terminal 1
PORT=8080 MONGODB_URI=mongodb://localhost:27017/aral_system JWT_SECRET=your_secret pnpm --filter @workspace/api-server run dev
```

Or with a `.env` file loaded via `dotenv-cli` or similar:
```bash
cd artifacts/api-server && pnpm run dev
```

The API server will:
- Build the bundle with esbuild
- Connect to MongoDB
- Seed a default super admin (username: `admin`, password: `Admin@1234`)
- Listen on the configured port (default: 8080)

### Start the Frontend

```bash
# Terminal 2
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/aral-system run dev
```

Open your browser to `http://localhost:3000`.

### Default Login Credentials

| Role | Username / Method | Password |
|------|-------------------|----------|
| Super Admin | `admin` | `Admin@1234` |
| School Head | Select school + school code (first login) | school code |
| Teacher | Select teacher name + PIN | teacher PIN |

---

## Building for Production

### Build the API Server

```bash
pnpm --filter @workspace/api-server run build
```

Output: `artifacts/api-server/dist/index.mjs` (bundled with all dependencies)

Run production server:
```bash
PORT=8080 MONGODB_URI=your_mongo_uri JWT_SECRET=your_secret node artifacts/api-server/dist/index.mjs
```

### Build the Frontend

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/aral-system run build
```

Output: `artifacts/aral-system/dist/` — static HTML, CSS, and JS files

Preview the production build locally:
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/aral-system run preview
```

---

## Deploying to a Hosting Provider

### Frontend (Static Hosting)

**Vercel:**
1. Import your Git repository
2. Framework Preset: `Vite`
3. Build Command: `pnpm --filter @workspace/aral-system run build`
4. Output Directory: `artifacts/aral-system/dist`
5. Set environment variables: `BASE_PATH=/`

**Netlify:**
1. Import your Git repository
2. Build Command: `pnpm --filter @workspace/aral-system run build`
3. Publish Directory: `artifacts/aral-system/dist`
4. Set environment variables: `BASE_PATH=/`

**Cloudflare Pages / GitHub Pages:**
Deploy the contents of `artifacts/aral-system/dist` as static files.

### Backend (Node.js Hosting)

**Railway / Render / Fly.io:**
1. Deploy the entire repository
2. Set the **start command** to:
   ```bash
   node artifacts/api-server/dist/index.mjs
   ```
3. Required environment variables:
   - `PORT` — provider-assigned port
   - `MONGODB_URI` — your MongoDB connection
   - `JWT_SECRET` — strong random secret
   - `NODE_ENV=production`

**Self-hosted (PM2):**
```bash
pnpm --filter @workspace/api-server run build
pm2 start artifacts/api-server/dist/index.mjs --name "aral-api"
```

### Full-Stack on a Single Server

For a single-machine deployment (e.g., VPS):

1. Build both frontend and backend:
   ```bash
   pnpm run build
   ```

2. Serve the frontend as static files (nginx, Apache, or a CDN)

3. Proxy `/api/*` requests to the backend:
   ```nginx
   server {
       listen 80;
       root /var/www/aral-system/artifacts/aral-system/dist;
       index index.html;

       location /api {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## API Codegen (Advanced)

The frontend React Query hooks and backend Zod schemas are auto-generated from `lib/api-spec/openapi.yaml` using Orval.

To regenerate after modifying the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | — | Server port (backend or Vite dev server) |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/aral_system` | MongoDB connection string |
| `JWT_SECRET` | Yes | `aral_system_secret_key_2024` | Secret key for signing JWTs |
| `BASE_PATH` | Yes | `/` | Frontend base URL path |
| `NODE_ENV` | No | `development` | `production` for prod mode |
| `LOG_LEVEL` | No | `info` | Server log level (trace/debug/info/warn/error/fatal) |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `PORT is required` | Environment variable missing | Set `PORT=8080` in `.env` |
| `MongooseServerSelectionError` | MongoDB not running | Start MongoDB locally or check connection string |
| `401 Unauthorized` | Missing or expired JWT | Log in again; the token expires after 7 days |
| `403 Forbidden` | User accessing wrong role route | Check sidebar navigation matches your role |
| `pnpm install fails` | Wrong package manager | Use `pnpm` — not npm or yarn |
| `CORS error` | Frontend and backend on different origins | Ensure backend has `cors()` enabled (default) |
| `Cannot find module '@workspace/...'` | Workspace not linked | Run `pnpm install` from the root |

---

## Development Notes

- The project uses **pnpm workspaces**. Always run `pnpm install` from the root directory.
- The API server bundles to a single `dist/index.mjs` file using esbuild — no need to deploy `node_modules`.
- Frontend uses Vite's dev server with HMR during development.
- The `lib/api-client-react` package reads `fetch` URLs relative to `/api` — set your frontend proxy accordingly.
- The app is fully client-side rendered (CSR). For SSR or SSG, additional configuration is needed.

---

## License

MIT
