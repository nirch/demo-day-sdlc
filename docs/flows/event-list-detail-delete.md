# Event list, detail, delete

Browse events, open one, and delete a draft event. See [architecture](../architecture.md) for the "draft only" rule.

## Roles
| Action | Admin | Judge |
|---|---|---|
| List page `/` | yes | no (`AdminRoute` redirects to `/events/<judgeEventId>`, or `/login` if unset) |
| `GET /api/events` | yes | allowed by the API (auth only) |
| Detail page and `GET /api/events/:id` | yes | yes |
| Delete | yes, draft only | no (403) |

## User-visible steps
**List** (`/`, admin)
1. Skeleton cards while loading; then an error with "Try again", an empty state with "Create Event", or one card per event.
2. Each card shows name, date, "N min per demo" and a status badge (Draft, Live, Completed). Clicking opens `/events/:id`.

**Detail** (`/events/:id`, admin or judge)
1. Shows name, status badge, date, time limit and description ("No description" if empty). 404 shows "Event not found"; other failures show "Failed to load event"; both offer "Back to Events".
2. Admins also see a back link, "View Scoring Summary" ([admin-views-results](admin-views-results.md)), the invite section ([invite-judges](invite-judges.md)), the criteria section ([manage-scoring-criteria](manage-scoring-criteria.md)) and "Delete Event".
3. Everyone sees the team list ([manage-teams](manage-teams.md)); it is read-only for judges, who also get scoring controls ([judge-scores-team](judge-scores-team.md)).

**Delete** (admin)
1. "Delete Event" appears only when the event is `draft`.
2. A confirm dialog warns that teams, criteria, scores and judge assignments will be removed.
3. On success the app navigates to `/`. On failure the dialog closes and the server error shows under the button.

## Files
Client (`client/src/`):
- `App.jsx`, `components/ProtectedRoute.jsx`, `components/AdminRoute.jsx`
- `pages/EventListPage.jsx`, `pages/EventDetailPage.jsx`
- `components/EventCard.jsx`, `StatusBadge.jsx`, `ConfirmDialog.jsx`, `SkeletonCard.jsx`
- `services/eventService.js`, `services/api.js`

Server (`server/src/`):
- `routes/eventRoutes.js`, `controllers/eventController.js`, `services/eventService.js`
- `middleware/auth.js`, `requireRole.js`, `errorHandler.js`
- `models/Event.js`, `models/index.js`
- Draft checks for children: `services/teamService.js` and `services/criteriaService.js` (`assertEventDraft`)

## API calls
All require a Bearer JWT.
- `GET /api/events` → 200 array of events (ordered by `date` desc). Fields: `id, name, description, date, status, time_limit, created_by, created_at, updated_at`.
- `GET /api/events/:id` → 200 event plus `creator { id, email }`; 404 `"Event not found"`.
- `DELETE /api/events/:id` (admin) → 200 `{ message: "Event deleted successfully" }`; 403 for non-admin; 404; 409 `"Only draft events can be deleted"`.

## Tables touched
- Read: `events`, `users` (creator join).
- Delete: `events` row; the database cascades (`ON DELETE CASCADE`) to `teams`, `criteria`, `event_judges`, `scores` and `team_comments`. Judge `users` rows are not deleted.

## Known limitations
- There is no event edit or update endpoint. "Draft only" therefore applies to deleting the event and to modifying its teams and criteria (see architecture).
- Events never leave `draft`, so every event is deletable through the app.
- Reads are not scoped: any authenticated user, including a judge, can list and fetch any event by id. There is no creator or assignment check.
- Draft-violation status codes differ: delete returns 409, team and criteria edits return 403.
- A non-UUID `:id` probably yields a database error and a 500 (unverified).
- The delete dialog does not mention that team comments are also removed by the cascade.
