# Manage teams

Add, edit, remove and reorder the teams of an event. See [architecture](../architecture.md).

## Roles
- Admin: all four actions, on draft events only.
- Judge: list only (`GET`). Judges see the team list without management buttons.

## User-visible steps
All on the event detail page, in the "Teams (N)" section ([event-list-detail-delete](event-list-detail-delete.md)).
- **Add:** "Add Team" opens a form (Team Name, Members, Presentation URL, Live App URL). Name is required (max 100) and Members is required. URLs are optional but must start with `http(s)://`. On success the form closes and the list is refetched. Server errors show in the form.
- **Edit:** "Edit" turns the card into a pre-filled form; "Save Changes" updates and refetches.
- **Remove:** "Remove" opens a confirm dialog; confirming deletes and refetches. The handler has no try/catch, so a failed delete shows no message in `TeamSection` (whether `ConfirmDialog` surfaces it is unverified).
- **Reorder:** up/down arrows swap two cards optimistically, then send the full ordered id list. On failure the list is refetched silently (the swap reverts with no message). There is no drag and drop.
- Controls only show when the event is `draft` and the user is an admin.

## Files
Client (`client/src/`):
- `pages/EventDetailPage.jsx`
- `components/TeamSection.jsx`, `TeamForm.jsx`, `TeamCard.jsx`, `ConfirmDialog.jsx`
- `hooks/useForm.js`
- `services/teamService.js`, `services/api.js`

Server (`server/src/`):
- `routes/teamRoutes.js`
- `validators/teamValidators.js`, `middleware/validate.js`
- `controllers/teamController.js`
- `services/teamService.js`
- `models/Team.js`
- `migrations/20260324000001-create-teams.js`, `20260330000001-add-sort-order-to-teams.js`

## API calls
Base: `/api/events/:eventId/teams`. All need a Bearer JWT.
| Call | Role | Notes |
|---|---|---|
| `GET /` | admin, judge | 200 teams ordered by `sort_order`; 404 if event missing |
| `POST /` | admin | Body `{ name, members, demo_presentation_url?, live_app_url? }`; 201 team |
| `PUT /reorder` | admin | Body `{ orderedIds: [uuid] }`; must match the event's team ids exactly (else 400); 200 teams in new order |
| `PUT /:teamId` | admin | Same body as POST (replaces all four fields; omitted URLs become null); 200 team |
| `DELETE /:teamId` | admin | 204, no body |

Errors: 400 validation (`[{ field, message }]`), 401, 403 (wrong role, or event not draft: `"Teams can only be modified while the event is in draft status"`), 404 (event or team), 409 duplicate team name in the event.

## Tables touched
- `teams`: columns `id, event_id, name, members, demo_presentation_url, live_app_url, sort_order`. Unique index on `(event_id, name)` (case-sensitive).
- `events`: read for the draft check.
- Create sets `sort_order = max + 1` (or 0). Reorder sets `sort_order = index` for each team inside one transaction. Delete leaves gaps; ordering still works.
- Deleting a team cascades to its `scores` and `team_comments`.

## Known limitations
- Draft only: enforced on the server (`assertEventDraft` in `teamService.js`) and in the UI. Since events never leave `draft`, the lock never engages in practice.
- No ownership check: any admin can modify any draft event's teams.
- `sort_order` on create is not transactional, so concurrent creates could collide (unverified).
- Client URL check (`^https?://.+`) and server `isURL()` differ, so a value can pass one and fail the other.
- Judges can list teams for any event id; there is no assignment check on `GET`.
- A non-UUID `:teamId` probably yields a 500 (unverified).
