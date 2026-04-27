# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Sonner (toasts), shadcn/ui
- **Backend**: Express on port 8000, TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT (7-day expiry, stored in `localStorage`), role-based (`SALES`, `COURSE_MANAGER`, `TRAINER`, `STUDENT`, `ADMIN`)
- **AI**: Anthropic Claude API — SOP analysis and course generation, both output validated with Zod schemas in `backend/src/services/ai.ts`

## Commands

### Frontend (run from repo root)
```bash
npm run dev        # Next.js dev server with Turbopack on :3000
npm run build      # Production build
npm run lint       # ESLint
tsc --noEmit       # Type-check frontend
```

### Backend (run from `backend/`)
```bash
npm run dev        # tsx watch — hot-reload Express on :8000
npm run build      # tsc → dist/
tsc --noEmit       # Type-check backend
npx prisma db push       # Push schema changes (dev)
npx prisma migrate dev   # Create + apply migration
npx prisma generate      # Regenerate Prisma Client after schema changes
npx prisma studio        # Visual DB browser
npx prisma db seed       # Seed default admin user (requires SEED_ADMIN_PASSWORD)
```

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...      # Required by Prisma for connection pooling
JWT_SECRET=<secret>
ANTHROPIC_API_KEY=<key>
FRONTEND_URL=http://localhost:3000
SEED_ADMIN_PASSWORD=<password>   # Only needed for seeding
```
The backend will throw and refuse to start if `DATABASE_URL`, `JWT_SECRET`, or `ANTHROPIC_API_KEY` are missing.

## Coding Workflow (follow this order every time)

1. **Fetch task** — `mcp__linear-server__get_issue` or `list_issues` to get the ticket
2. **Implement** — `/sc:implement [feature] --with-tests`
3. **Type-check** — `tsc --noEmit` (root) + `cd backend && tsc --noEmit`
4. **Review** — `/Users/roymkhabela/.local/bin/cr review --plain` (CodeRabbit CLI)
5. **Fix findings** — `/sc:improve --safe` for any CodeRabbit issues
6. **Commit** — `/sc:git --smart-commit`
7. **Update Linear** — mark ticket Done via `mcp__linear-server__save_issue`

## MCP Stack
- **Tasks**: Linear MCP only (`mcp__linear-server__*`)
- **Lib docs**: Context7 MCP (`mcp__context7__resolve-library-id` → `mcp__context7__query-docs`)
- **Code ops**: Native tools only — Read, Edit, MultiEdit, Grep, Glob, Bash
- **Never use**: Archon MCP, Serena MCP

## Branch Naming
`claude/<feature-name>` — always branch from `main`

## TypeScript
- Run `tsc --noEmit` on BOTH frontend and backend before every commit
- Fix all type errors — no `any` unless unavoidable

## Architecture

### Request Lifecycle
The core domain object is `ClientRequest` (created by SALES reps). Each request drives the full workflow:

```
ClientRequest (PENDING)
  └─ SOPDocument(s) uploaded → extracted text stored
      └─ /analyze → Claude analyzes SOPs, stores JSON result
          └─ /generate → Claude generates course (requires ≥1 analyzed SOP)
              └─ GeneratedCourse (GENERATED → UNDER_REVIEW → APPROVED | REQUIRES_REVISION)
                  └─ APPROVED sets parent ClientRequest status to COMPLETED
```

Course generation merges analysis results from all analyzed SOPs on the request before calling Claude.

### Frontend → Backend Communication
The frontend calls the backend directly (no Next.js API proxy). `lib/api-client.ts` is a singleton `ApiClient` class that:
- Reads `NEXT_PUBLIC_API_URL` as `baseURL`
- Injects `Authorization: Bearer <token>` on every request via an Axios interceptor
- Intercepts 401 responses (except on `/api/auth/login`) to clear the token and redirect to `/login`
- Shows a `sonner` toast for all other API errors

### Auth & RBAC
- `AuthProvider` (wraps the entire app in `app/layout.tsx`) hydrates the user from the stored JWT on mount via `GET /api/auth/me`
- `RoleGuard` component — wrap any page or section to restrict by role; redirects unauthenticated users to `/login`
- New users register as `SALES` by default. Only `ADMIN` can promote users to other roles via `POST /api/admin/users/:id/role`
- JWT payload carries `{ sub: userId, role }` — the backend's `requireRole()` middleware reads `req.userRole` set by `requireAuth`

### Data Model Notes
- `GeneratedCourse.modules` is a Prisma `Json` field — the frontend types it as `CourseModule[]` (defined in `lib/api-client.ts`), but no runtime validation occurs on the frontend
- `SOPDocument.analysis` is also `Json` — cast to `SOPAnalysis` on use
- `SALES` users are scoped: they only see their own `ClientRequest`s and `GeneratedCourse`s; `COURSE_MANAGER` and `ADMIN` see all

### Portal Pages & Components
Each role has a dedicated portal page under `app/`:

| Route | Role(s) | Component |
|---|---|---|
| `/sales` | SALES, COURSE_MANAGER, ADMIN | `components/sales/` — `ClientRequestForm`, `RequestsList`, `CourseGenerator` |
| `/course-manager` | COURSE_MANAGER, ADMIN | `components/course-manager/CourseManagerPortal` |
| `/admin` | ADMIN | `app/admin/page.tsx` |
| `/trainer` | TRAINER | `app/trainer/page.tsx` |
| `/student` | STUDENT | `app/student/page.tsx` |

All portal pages gate access with `<RoleGuard allowedRoles={[...]}>`.

### Backend Route Map
| Prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.ts` | register, login, `/me` |
| `/api/admin/users` | `routes/admin.ts` | user management (ADMIN only) |
| `/api/clients` | `routes/clients.ts` | client requests, SOP upload/analyze, stats |
| `/api/courses` | `routes/courses.ts` | course CRUD, generate, status, trainer assignment |

All non-auth routes apply `requireAuth` then `requireRole` at the router level; some individual endpoints add a second `requireRole` for stricter access (e.g., `PATCH /status` is `COURSE_MANAGER | ADMIN` only).

### AI Services (`backend/src/services/ai.ts`)
Two exported functions, both call the Anthropic API and parse the response with Zod:
- `analyzeSOPDocument(text)` → `SOPAnalysis`
- `generateCourse(params)` → `GeneratedCourseData` (title, description, modules array)

Both use `claude-3-5-sonnet` (or whatever model is current in the file). If Claude returns malformed JSON the Zod parse will throw, bubbling to the Express error handler.

## Key Files
- API client + all shared TS types: `lib/api-client.ts`
- Auth context + `RoleGuard`: `lib/contexts/AuthContext.tsx`
- Backend routes: `backend/src/routes/`
- AI service (SOP analysis + course generation): `backend/src/services/ai.ts`
- Prisma schema: `backend/prisma/schema.prisma`
- Pages: `app/` (Next.js App Router)
- Components by role: `components/sales/`, `components/course-manager/`
