# Architecture

Demo Day is a web app for running hackathon-style demo days. Admins create events, teams and scoring criteria and invite judges by link; judges score teams; admins view ranked results. Behavior of each user flow lives in [flows/](flows/); this document covers the structure they share.

## Repo layout
```
.env, .env.example     shared config (read by the server from the repo root)
CLAUDE.md              project conventions
client/                React app (Vite)
  src/pages/           route-level screens
  src/components/      shared UI
  src/context/         AuthContext
  src/hooks/           useForm
  src/services/        one file per API area, built on api.js
  src/styles/          tokens.css, index.css
server/                Express API
  src/app.js           middleware and route mounting
  src/server.js        process entry
  src/routes/          route definitions
  src/validators/      express-validator rules
  src/controllers/     thin request handlers
  src/services/        business logic and DB access
  src/models/          Sequelize models and associations (models/index.js)
  src/middleware/      auth, requireRole, validate, errorHandler
  src/migrations/      timestamped schema changes
  src/seeders/         admin user seed
  src/config/, utils/  database config, winston logger
docs/                  this documentation
```

## Stack
Node.js 22.12+; React 19 with Vite, React Router and axios (ES modules); Tailwind; Express 5 (CommonJS); express-validator; winston; Sequelize 6 on PostgreSQL; JWT; Jest and supertest. Configuration comes from the root `.env` (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `PORT`, `NODE_ENV`; see `.env.example`).

## Data model
All ids are UUIDs. Associations are declared in `server/src/models/index.js`.

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Admins and judges | `email` (nullable, unique), `password` (nullable), `role` (`admin` or `judge`), `name`, `title`, `company` |
| `events` | A demo day | `name`, `description`, `date`, `status` (`draft`, `active`, `completed`), `time_limit`, `created_by` → users, `judge_invite_token` (nullable, unique) |
| `teams` | Teams in an event | `event_id`, `name`, `members`, `demo_presentation_url`, `live_app_url`, `sort_order`; unique `(event_id, name)` |
| `criteria` | Scoring criteria of an event | `event_id`, `name`, `description`, `sort_order`; unique `(event_id, name)` |
| `event_judges` | Judges assigned to an event | `event_id`, `user_id`; unique pair |
| `scores` | One value per judge, team and criterion | `event_id`, `team_id`, `criterion_id`, `judge_id`, `value` (1–5); unique `(team_id, criterion_id, judge_id)` |
| `team_comments` | One comment per judge and team | `event_id`, `team_id`, `judge_id`, `comment`; unique `(team_id, judge_id)` |

Deleting an event cascades (`ON DELETE CASCADE`) to its teams, criteria, `event_judges`, scores and comments. Deleting a team cascades to its scores and comments. Judge `users` rows are not removed with the event. Schema changes are new files in `server/src/migrations/`.

## Auth and roles
- Login: `POST /api/auth/login` returns a JWT (payload `{ id, email, role }`, 24h) for users with an email and password ([admin-login](flows/admin-login.md)). Judges get a JWT (payload `{ id, name, role }`, 24h) by joining through an invite link instead ([judge-joins](flows/judge-joins.md)).
- Server: `middleware/auth.js` verifies the Bearer token and sets `req.user` from the token only (no database lookup). `middleware/requireRole.js` returns 403 `"Insufficient permissions"` when the role is not allowed.
- Client: the token and user are kept in `localStorage` (`token`, `user`, and `judgeEventId` for judges). `api.js` adds the Bearer header and, on a 401 from anything but the login call, clears storage and redirects to `/login`. `ProtectedRoute` requires a token; `AdminRoute` requires role `admin` and otherwise sends judges to `/events/<judgeEventId>` (or `/login`).
- Two roles exist: `admin` and `judge`.

Role summary (server-enforced unless noted):

| Area | Admin | Judge |
|---|---|---|
| Events: list, get | yes | yes (not scoped to assigned events) |
| Events: create, delete | yes | no |
| Teams: list | yes | yes |
| Teams: add, edit, remove, reorder | yes | no |
| Criteria: list | yes | yes |
| Criteria: add, edit, remove, reorder | allowed, but **see limitation below** | allowed by the server, hidden in the UI |
| Invite token: generate, read | yes | no |
| Invite: validate, join | public | public |
| Score a team, read own scores | no | yes (assigned judges only) |
| Scoring summary | yes | no |

## Response envelope
Every API response is `{ data, error }` with a matching HTTP status; success has `error: null`, failure has `data: null`.
- Validation failures: 400 with `error` as an array of `{ field, message }` (`middleware/validate.js`).
- Other errors: `error` is a message string, with the status taken from `err.status` (default 500). When `NODE_ENV=production`, 500 messages are replaced with `"Internal server error"`. Details and stack traces are logged with winston and never sent to the client (`middleware/errorHandler.js`).
- Typical codes: 401 unauthenticated, 403 forbidden or draft-lock, 404 missing, 409 conflict, 422 incomplete scores.

## Layering
`routes → validators + validate → controllers → services → models`
- Routes (`server/src/routes/`) attach `auth`, then `requireRole(...)` where a role check exists, then validators and `validate`, then a controller.
- Controllers stay thin: read the request, call a service, send the envelope.
- Services hold the business logic and all database access. Multi-step writes use a Sequelize transaction (event creation with default criteria, team reorder, criteria reorder, judge join, score upsert).
- Models define columns and associations.
- Errors are passed with `next(err)` (status set on the error) to the central error handler.
- Routes are mounted in `server/src/app.js` under `/api`: `/auth`, `/events`, `/events/:eventId/teams`, `/events/:eventId/criteria`, `/events/:eventId` (scores and the scoring summary), `/events/:eventId/judge-invite` (admin) and `/judge-invite` (public).

## Client structure
- `App.jsx` holds the route table: `/login` and `/judge-invite/:token` are public; `/events/:id` needs login; `/`, `/events/new` and `/events/:id/scoring-summary` need the admin role.
- `pages/` has one component per screen (login, event list, create event, event detail, judge join, scoring summary). `components/` holds shared UI (forms, cards, dialogs, sections for teams, criteria and invites, the scoring modal).
- `services/*.js` has one file per API area (`authService`, `eventService`, `teamService`, `criteriaService`, `judgeInviteService`, `scoreService`) built on `services/api.js`. React code calls the API only through these.
- `context/AuthContext.jsx` provides `user`, `token`, `login`, `loginAsJudge` and `logout`. `hooks/useForm.js` provides form state and validation.
- Styling uses Tailwind classes backed by tokens in `client/src/styles/tokens.css`.
- The event detail page is shared by both roles and renders different sections depending on role.

## The "draft only" rule for edits
There is no endpoint to edit an event itself. "Draft only" applies to changes around an event:
- Teams (add, edit, remove, reorder) and criteria (add, edit, remove, reorder) can only be modified while `events.status = 'draft'`. The server enforces this in `assertEventDraft` (`services/teamService.js`, `services/criteriaService.js`) and returns 403; the UI hides the controls otherwise.
- An event can only be deleted while it is `draft`; otherwise the server returns 409 (`services/eventService.js`).
- Scoring does not check event status.

See [manage-teams](flows/manage-teams.md), [manage-scoring-criteria](flows/manage-scoring-criteria.md) and [event-list-detail-delete](flows/event-list-detail-delete.md).

## Known limitations
- **Events never leave `draft`.** New events are created as `draft`, and no code path changes `events.status`. `active` and `completed` exist in the schema and in the status badge only, so in the app the draft lock never engages and every event stays editable and deletable.
- **Criteria write routes have no role check.** In `server/src/routes/criteriaRoutes.js` only `GET /` uses `requireRole`; POST, PUT (including `/reorder`) and DELETE require only a valid token, so a judge token can change criteria of a draft event. The UI shows the criteria section to admins only.
- Event, team and criteria reads are not scoped to the creator or to assigned judges; ownership is not checked on writes.
- Judges have no credentials; their session is the 24h JWT in `localStorage`.
- Invite tokens do not expire and can be revoked only by regenerating them.

## Flow docs
- [Admin login](flows/admin-login.md)
- [Create event](flows/create-event.md)
- [Event list, detail, delete](flows/event-list-detail-delete.md)
- [Manage teams](flows/manage-teams.md)
- [Manage scoring criteria](flows/manage-scoring-criteria.md)
- [Invite judges](flows/invite-judges.md)
- [Judge joins](flows/judge-joins.md)
- [Judge scores a team](flows/judge-scores-team.md)
- [Admin views results](flows/admin-views-results.md)
