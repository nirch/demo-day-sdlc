# Create event

An admin creates a new event. It starts in `draft` status with five default scoring criteria. See [architecture](../architecture.md).

## Roles
- Admin only. Server: `requireRole('admin')`. Client: `AdminRoute`.

## User-visible steps
1. On the event list (`/`), click "Create Event" (header button, or the empty-state link).
2. On `/events/new`, fill in:
   - Event Name (required)
   - Date (required, not before today)
   - Time Limit in minutes per demo (required on the client, integer 1–60, default "7")
   - Description (optional)
3. Validation runs on blur, on change after touch, and on submit.
4. On success the page navigates to `/`. There is no toast and it does not open the new event.
5. On failure an inline alert shows the server message (arrays are joined with ". ") or "Failed to create event. Try again."
6. Cancel returns to `/`.

## Files
Client (`client/src/`):
- `pages/CreateEventPage.jsx`, `pages/EventListPage.jsx`
- `hooks/useForm.js`
- `services/eventService.js` (`createEvent`), `services/api.js`
- `components/AdminRoute.jsx`, `Input.jsx`, `TextArea.jsx`, `Button.jsx`
- `App.jsx`

Server (`server/src/`):
- `routes/eventRoutes.js`
- `middleware/auth.js`, `requireRole.js`, `validate.js`
- `validators/eventValidators.js`
- `controllers/eventController.js`
- `services/eventService.js`, `services/criteriaService.js` (`DEFAULT_CRITERIA`, `seedDefaults`)
- `models/Event.js`, `models/Criterion.js`
- `migrations/20260323000002-create-events.js`, `20260326000002-add-judge-invite-token-to-events.js`, `20260324000002-create-criteria.js`

## API calls
`POST /api/events` (Bearer JWT, admin)
- Body: `{ name, date, time_limit?, description? }`.
- Validation: `name` trimmed and non-empty; `date` a valid date, today or later (server-local midnight); `time_limit` optional integer 1–60; `description` optional.
- 201: `{ data: <event>, error: null }` with `status: "draft"`.
- 400 validation array, 401, 403 for non-admin.

## Tables touched
One transaction (`eventService.create`):
- `events`: one row, `status = 'draft'`, `time_limit` defaults to 7, `created_by` is the caller.
- `criteria`: five default rows (Technical Complexity, Product Quality, UI/UX Design, Presentation & Communication, Innovation & Creativity), `sort_order` 0–4.

No invite token, teams or judges are created.

## Known limitations
- Events never leave `draft` status. There is no endpoint that changes `events.status`; `active` and `completed` exist in the enum and in `StatusBadge` but nothing in the app sets them.
- The client compares the date against the UTC date while the server compares against server-local midnight, so around midnight the two can disagree (unverified at runtime).
- `time_limit` is required by the client form but optional on the server (defaults to 7).
- Event names are not unique.
