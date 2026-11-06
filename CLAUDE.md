# Demo Day

<!-- Teaching notes: every "Why" below is an HTML comment. Claude Code strips these before loading the file, so they cost no tokens. Keep them for your team or delete them. -->

## Overview
Web app for running hackathon-style demo days: admins create events, teams and scoring criteria, invite judges by link, and judges score teams. Admin and judge roles. Read `docs/` for background, `docs/design-brief.md` for UI direction and `docs/use-cases.md` for behavior. Don't copy their content here.
<!-- Why: one source per fact. Duplicated docs drift, and Claude then trusts the stale copy. -->

## Stack
<!-- CUSTOMIZE: replace with your stack -->
| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Runtime    | Node.js 22.12 or later                          |
| Frontend   | React 19 (Vite), React Router, axios; ES modules |
| Styling    | Tailwind                                        |
| Backend    | Express 5; CommonJS                             |
| Validation | express-validator                               |
| Logging    | winston                                         |
| ORM        | Sequelize 6                                     |
| Database   | PostgreSQL                                      |
| Auth       | JWT                                             |
| Testing    | Jest, supertest                                 |

<!-- Why: stops Claude from suggesting libraries or syntax (e.g. `import` in the server) that don't fit. The Node version avoids confusing install and build errors (Vite 8 and uuid 13 need 22.12+). -->

## Commands
<!-- CUSTOMIZE: replace with your real commands and folders -->
Config comes from the root `.env` (copy `.env.example`). Needs a running PostgreSQL.
- Server (in `server/`): `npm run db:migrate`, `npm run db:seed` (admin user; fails harmlessly if it already exists), `npm run dev` (port 3000)
- Client (in `client/`): `npm run dev` (port 5173, proxies `/api` to 3000)
- Test (in `server/`): `npm test`. Jest is installed but no tests exist yet, so it currently exits 1 ("No tests found").
- Lint: `npm run lint` in `server/` and in `client/`. Both pass with warnings only.
<!-- Why: Claude must run the real commands from the right folder; each package is separate. -->

## Conventions
Patterns to follow (the code mostly does this today):

### API and server
- Routes live under `/api` and use kebab-case paths (e.g. `/api/judge-invite`).
- Layering: `routes` -> `validators` + `validate` -> `controllers` -> `services` -> `models`. Controllers stay thin; DB logic lives in services.
- Every API response is `{ data, error }` with a correct HTTP status (never 200 with an error body).
- Routes use `auth`, then `requireRole(...)` for admin-only actions.

### Database
- Schema changes are new timestamped files in `server/src/migrations/`; never edit an applied one or alter tables by hand. Every migration has a `down` that fully reverses the `up`.
- Use a Sequelize transaction for any multi-step write (see `eventService.create`).
- Naming: models are singular PascalCase, tables plural snake_case, columns snake_case, ids UUIDs.

### Errors and logging
- Errors go through `next(err)` (set `err.status`) to `middleware/errorHandler.js`.
- Never swallow errors (no empty `catch`). Clients get a message, never a stack trace; log details server-side.
- Logging uses `utils/logger.js` (winston); no `console.*` in committed code.

### Client and styling
- One `services/*.js` file per API area, built on `services/api.js`; React never calls the DB, only the API.
- Pages in `pages/`, shared UI in `components/`. React components are `PascalCase.jsx`, one per file; other modules are camelCase.
- No hardcoded colors or sizes. Values live in `client/src/styles/tokens.css` and reach components through Tailwind classes.

### Config
- Config and secrets come from `.env`; add every new var to `.env.example` with a placeholder. No hardcoded secrets, URLs, IDs or magic numbers.

<!-- Why: these are the patterns the code already follows, so new code fits and reviews fast. Each rule also blocks a common agent mistake (silent errors, hand-edited schema, leaked secrets). Adapt the list to your codebase. -->

## SDLC workflow
Work flows through three skills: `/product` (requirements), `/dev` (implement), `/qa` (verify). Each skill holds its own instructions.
<!-- Why: separate roles keep each step focused. Keep process details in the skills, not here. -->

## Git and commits
- Work on a feature branch, not `main`.
- Small commits, imperative subject line.
- Run lint before committing.
<!-- Why: small commits are easy to review and revert; lint catches mistakes early. -->

## Testing policy
- No backfill: don't write tests for existing code just to raise coverage.
- New and changed code gets tests (server: Jest + supertest in `server/src/__tests__/`).
<!-- Why: backfilling is slow and low value; tying tests to changes grows coverage where risk is. -->
