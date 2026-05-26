# ARAL System

ARAL System is a fullstack MERN (MongoDB, Express, React, TypeScript) educational platform designed for Philippine DepEd schools to track learner profiles, manage teacher assignments, and monitor reading intervention programs.

## Features

- **Super Admin:** manage schools, activate/suspend accounts, and view system summaries
- **School Head:** manage school profile, grade levels, teachers, and learners
- **Teacher:** manage learners, ARAL intervention records, attendance, and reading levels
- **Role-Based Access:** JWT-secured workflows for super admins, school heads, and teachers
- **ARAL Tracking:** learner profiles, intervention flags, reading levels, and attendance records

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, Recharts, Wouter |
| Backend | Express 5, TypeScript, Mongoose, esbuild |
| Database | MongoDB Atlas or MongoDB 7.0+ |
| Validation | Zod |
| Auth | JWT bearer tokens |
| Package Manager | pnpm workspaces |

## Project Structure

```text
artifacts/
  api-server/          Express API server, default port 8080
    src/
      routes/          API route handlers
      models/          Mongoose schemas
      middlewares/     auth middleware
      lib/             env, jwt, mongodb, logger helpers
      seed.ts          optional initial super admin seed
      index.ts         server entry point
  aral-system/         React frontend, default port 3000
    src/
      pages/
      components/
      lib/
      App.tsx
lib/
  api-spec/            OpenAPI spec and codegen config
  api-zod/             generated Zod schemas
  api-client-react/    generated React Query API hooks
```

## Prerequisites

1. Node.js 20+
2. pnpm 10+
3. MongoDB Atlas connection string, or a running local MongoDB instance

## Install

From the repository root:

```powershell
pnpm install
```

## Environment Setup

The backend loads environment variables from:

```text
artifacts/api-server/.env
```

Create it from the example:

```powershell
Copy-Item artifacts/api-server/.env.example artifacts/api-server/.env
```

Fill it in:

```env
PORT=8080
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/aral_system?retryWrites=true&w=majority
JWT_SECRET=replace_with_at_least_32_random_characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace_with_a_strong_initial_password_min_10_chars
ADMIN_UPDATE_PASSWORD_ON_START=false
SEED_DEMO_DATA=false
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

Security notes:

- `MONGODB_URI` is required. The API will not start without it.
- `JWT_SECRET` is required and must be at least 32 characters.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` are used to seed the first super admin if one does not already exist.
- `ADMIN_PASSWORD` must be at least 10 characters.
- Set `ADMIN_UPDATE_PASSWORD_ON_START=true` only when you intentionally want startup to reset the seeded admin password.
- Set `SEED_DEMO_DATA=true` only for local development when you want a usable demo school, teacher, and learners.
- There are no default admin credentials anymore.
- Do not commit `.env` files.

## MongoDB Atlas Setup

Use Atlas if you do not want to install MongoDB locally.

1. Create a free MongoDB Atlas account.
2. Create a free cluster.
3. Create a **Database User** for this app.
4. Save the database username and password.
5. Go to **Network Access** and add your current IP address.
6. Open the cluster and click **Connect**.
7. Choose **Drivers** and select Node.js.
8. Copy the `mongodb+srv://...` connection string.
9. Replace the username/password placeholders.
10. Use database name `aral_system` in the URI.
11. Paste the final URI into `artifacts/api-server/.env` as `MONGODB_URI`.

Example shape:

```env
MONGODB_URI=mongodb+srv://aral_app_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/aral_system?retryWrites=true&w=majority
```

If your password contains special characters like `@`, `:`, `/`, `#`, `%`, or spaces, URL-encode it before putting it in the URI.

## Running Locally

Start the API server:

```powershell
cd artifacts/api-server
pnpm run dev
```

The API server will:

- load `artifacts/api-server/.env`
- connect to MongoDB
- seed the first super admin if `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- listen on port `8080` by default

Start the frontend in a second terminal:

```powershell
cd artifacts/aral-system
pnpm run dev
```

Open:

```text
http://localhost:3000
```

The frontend proxies `/api` requests to:

```text
http://localhost:8080
```

## Login

The initial super admin credentials are whatever you put in:

```env
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

After logging in as Super Admin, create and activate schools from the admin UI. School Head and Teacher logins depend on the schools, grade levels, and teachers created in the app.

If `SEED_DEMO_DATA=true`, the backend also creates:

| Role | Login |
|------|-------|
| School Head | Select `ARAL Demo Elementary School`, password `school@1234` |
| Teacher | Select `ARAL Demo Elementary School`, PIN `123456` |

## Build

Build the API:

```powershell
pnpm --filter @workspace/api-server run build
```

Build the frontend:

```powershell
pnpm --filter @workspace/aral-system run build
```

Build everything:

```powershell
pnpm run build
```

## Production

API start command:

```bash
node artifacts/api-server/dist/index.mjs
```

Required backend environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | API server port. Hosting providers often inject this. |
| `MONGODB_URI` | Yes | MongoDB Atlas or MongoDB connection string. |
| `JWT_SECRET` | Yes | At least 32 characters. Used to sign JWTs. |
| `ADMIN_USERNAME` | No | Seeds initial admin when no admin exists. |
| `ADMIN_PASSWORD` | No | Seeds initial admin. Must be at least 10 characters if set. |
| `ADMIN_UPDATE_PASSWORD_ON_START` | No | Set to `true` to overwrite the existing seeded admin password on startup. |
| `SEED_DEMO_DATA` | No | Set to `true` to create a demo school, grade level, teacher, and learners. |
| `CORS_ORIGIN` | Yes | Allowed frontend origin, for example `https://your-site.com`. |
| `LOG_LEVEL` | No | `trace`, `debug`, `info`, `warn`, `error`, or `fatal`. |

Frontend build output:

```text
artifacts/aral-system/dist
```

For same-domain deployment, proxy `/api/*` to the API server. For separate frontend/backend domains, set backend `CORS_ORIGIN` to the exact frontend URL.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `MONGODB_URI is required` | Backend `.env` missing or incomplete | Create `artifacts/api-server/.env` and set `MONGODB_URI`. |
| `JWT_SECRET is required` | Missing JWT secret | Set a long random `JWT_SECRET`. |
| `JWT_SECRET must be at least 32 characters long` | Secret is too short | Use a longer random value. |
| `MongooseServerSelectionError` | MongoDB cannot be reached | Check Atlas IP allowlist, username/password, and URI. |
| `CORS error` | Frontend origin not allowed | Set `CORS_ORIGIN=http://localhost:3000` for local dev. |
| Blank frontend after loading | API is not running or `/api` cannot connect | Start `artifacts/api-server` first, then restart Vite. |
| `Cannot find module '@workspace/...'` | Workspace packages are not linked | Run `pnpm install` from the repository root. |

## API Codegen

The React Query hooks and Zod schemas are generated from:

```text
lib/api-spec/openapi.yaml
```

Regenerate after changing the API spec:

```powershell
pnpm --filter @workspace/api-spec run codegen
```

## Development Notes

- Use pnpm from the repository root for installs.
- Use `artifacts/api-server/.env` for backend secrets.
- Do not use fake production secrets.
- The API bundle is written to `artifacts/api-server/dist`.
- The frontend bundle is written to `artifacts/aral-system/dist`.
- The frontend API client calls relative `/api` URLs, so Vite or production hosting must proxy `/api` to the backend.

## License

MIT
