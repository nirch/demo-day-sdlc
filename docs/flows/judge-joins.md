# Judge joins

A judge opens an invite link, enters a name, role and company, and is signed in without a password. Link creation is in [invite-judges](invite-judges.md). See [architecture](../architecture.md).

## Roles
- Public. No authentication is needed to validate or join; joining always creates a user with role `judge`.

## User-visible steps
1. The judge opens `/judge-invite/:token` (public route, outside `ProtectedRoute`).
2. The page shows a skeleton while it validates the token.
3. Any validation failure (invalid token, network error) shows "Invalid Invite Link". The client does not distinguish causes.
4. Otherwise it shows "Join as Judge" with the event name and a form: Name (2–50), Role (2–50), Company (2–100), all required. Validation runs on blur and submit.
5. On success the page stores the session (`loginAsJudge`) and navigates to `/events/:id`.
6. On a 409 the server message is shown; any other error shows "Something went wrong. Please try again."
7. The judge lands on the event detail page: read-only teams, scoring controls, no invite or criteria sections ([judge-scores-team](judge-scores-team.md)).

## Files
Client (`client/src/`):
- `App.jsx` (route `/judge-invite/:token`)
- `pages/JudgeJoinPage.jsx`
- `services/judgeInviteService.js` (`validateInviteToken`, `joinAsJudge`)
- `context/AuthContext.jsx` (`loginAsJudge` stores `token`, `user`, `judgeEventId` in `localStorage`)
- `components/AdminRoute.jsx` (redirects judges to `/events/<judgeEventId>`), `ProtectedRoute.jsx`, `Layout.jsx`
- `services/api.js`

Server (`server/src/`):
- `routes/judgeInviteRoutes.js` (`publicRouter`)
- `validators/judgeInviteValidators.js`, `middleware/validate.js`
- `controllers/judgeInviteController.js`
- `services/judgeInviteService.js`
- `models/User.js`, `EventJudge.js`, `Event.js`
- `migrations/20260326000001-add-judge-support-to-users.js`, `20260326000003-create-event-judges.js`

## API calls
Base: `/api/judge-invite` (no auth).
- `GET /:token` → 200 `{ data: { event: { id, name } } }`; 404 `"This invite link is not valid"`.
- `POST /:token/join`, body `{ name, title, company }` (trimmed, required; name 2–50, title 2–50, company 2–100).
  - 201: `{ data: { token, user: { id, name, role: "judge" }, event: { id, name } } }`. The JWT payload is `{ id, name, role }`, 24h expiry.
  - 400 validation array; 404 invalid token; 409 `"A judge with this name has already joined this event"` (case-insensitive match on name within the event).

## Tables touched
One transaction in `judgeInviteService`:
- `events`: read by `judge_invite_token`.
- `users`: insert a row with `role = 'judge'`, `name`, `title`, `company`; email and password are null.
- `event_judges`: insert `(event_id, user_id)` (unique index on the pair).

## Known limitations
- Judges have no credentials. The only way back in is the stored JWT. After it expires (24h) the next call returns 401 and the client redirects to `/login`, which is an email/password form, so a judge would have to re-join (unverified end to end).
- Each join creates a new user. Re-joining under the same name is rejected with 409; under a different spelling it creates a second judge. The name check is not backed by a database constraint.
- Anyone with the link can join; there is no expiry, use limit or rate limiting.
- Event status is not checked, so judges can join a draft event.
- Opening the link while logged in as an admin overwrites that browser's stored session (follows from `loginAsJudge`; unverified in a browser).
- Server validation arrays are ignored by the page, which shows a generic error.
