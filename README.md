# ARAL System

ARAL System is a full-stack educational management platform for school-level learner profiling, teacher assignment, attendance monitoring, and reading intervention tracking.

The application is organized as a pnpm workspace with a React frontend, an Express API, generated API clients, and MongoDB-backed persistence.

## Core Capabilities

- Role-based access for Super Admin, School Head, and Teacher workflows
- School registration, activation, suspension, and profile management
- Grade level and teacher assignment management
- Learner profile management with ARAL intervention tagging
- Reading level and attendance tracking
- Generated API clients and shared schema packages

## Technology

| Area | Stack |
|------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, Wouter |
| Backend | Express 5, TypeScript, Mongoose, esbuild |
| Database | MongoDB |
| API Tooling | OpenAPI, Orval, Zod, React Query |
| Package Manager | pnpm workspaces |

## Repository Layout

```text
artifacts/
  api-server/          Express API service
  aral-system/         React/Vite web application
lib/
  api-spec/            OpenAPI specification and codegen config
  api-zod/             Generated Zod schemas
  api-client-react/    Generated React Query client
```

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- MongoDB connection string

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Create the API environment file:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Configure the values in `artifacts/api-server/.env`.

Required backend variables:

| Variable | Purpose |
|----------|---------|
| `PORT` | API server port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `CORS_ORIGIN` | Allowed frontend origin |

Optional backend variables:

| Variable | Purpose |
|----------|---------|
| `ADMIN_USERNAME` | Seeds an initial super admin when no admin exists |
| `ADMIN_PASSWORD` | Password for the initial seeded admin |
| `ADMIN_UPDATE_PASSWORD_ON_START` | Allows an intentional admin password reset during startup |
| `SEED_DEMO_DATA` | Seeds local development sample records |
| `LOG_LEVEL` | API logging level |

Do not commit `.env` files. The repository includes only templates.

## Development

Start the API server:

```bash
cd artifacts/api-server
pnpm run dev
```

Start the frontend:

```bash
cd artifacts/aral-system
pnpm run dev
```

The frontend uses relative `/api` requests. In local development, Vite proxies those requests to the API server.

## Build

Build the API:

```bash
pnpm --filter @workspace/api-server run build
```

Build the frontend:

```bash
pnpm --filter @workspace/aral-system run build
```

Build all workspace projects:

```bash
pnpm run build
```

## API Code Generation

The API clients and shared schemas are generated from:

```text
lib/api-spec/openapi.yaml
```

Regenerate after changing the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Deployment Notes

- Serve `artifacts/aral-system/dist` as the frontend static build.
- Run `artifacts/api-server/dist/index.mjs` as the API entry point.
- Configure production secrets through your hosting provider, not committed files.
- Set `CORS_ORIGIN` to the exact deployed frontend URL.
- Proxy `/api/*` to the backend when serving frontend and API on the same domain.

## Security Notes

- Never commit database credentials, JWT secrets, or seeded account passwords.
- Use separate MongoDB users for development and production.
- Use a long random `JWT_SECRET`.
- Disable local-only seed/reset flags in production.
- Rotate credentials immediately if they were ever shared publicly.

## License

MIT
