# Invite judges

An admin generates a shareable invite link for an event. The judge side is in [judge-joins](judge-joins.md). See [architecture](../architecture.md).

## Roles
- Admin only (generate and read the token). The public validate/join endpoints belong to [judge-joins](judge-joins.md).

## User-visible steps
1. The admin opens `/events/:id`. The invite section renders only for admins.
2. The section loads the current token (skeleton while loading).
3. With no token, "Generate Invite Link" is shown.
4. With a token, it shows a read-only URL (`<origin>/judge-invite/<token>`), a "Copy Link" button ("Copied!" for 2s), a QR code and "Regenerate Link".
5. Regenerating replaces the token with no confirmation prompt; the old link stops working.

## Files
Client (`client/src/`):
- `components/InviteJudgeSection.jsx`
- `pages/EventDetailPage.jsx`
- `services/judgeInviteService.js` (`generateInviteToken`, `getInviteToken`)

Server (`server/src/`):
- `routes/judgeInviteRoutes.js` (`adminRouter`)
- `controllers/judgeInviteController.js`
- `services/judgeInviteService.js`
- `middleware/auth.js`, `requireRole.js`
- `models/Event.js`
- `migrations/20260326000002-add-judge-invite-token-to-events.js`

## API calls
Base: `/api/events/:eventId/judge-invite` (Bearer JWT, admin).
- `POST /` (no body) → 200 `{ data: { judge_invite_token } }`. Generates a new UUID and overwrites any existing one.
- `GET /` → 200 `{ data: { judge_invite_token } }` (null if never generated).
- Errors: 401, 403 `"Insufficient permissions"`, 404 `"Event not found"`.

## Tables touched
- `events.judge_invite_token` (UUID, nullable, unique): written on generate, read on get.

## Known limitations
- The token never expires and is not single-use. Regenerating is the only way to revoke a link, and it does not affect judges who already joined.
- The join page text says the link "has expired", but nothing expires; only regeneration invalidates a token.
- There is no endpoint or UI to list or remove an event's judges (the scoring summary shows assigned judges as a side effect: [admin-views-results](admin-views-results.md)).
- Neither generate nor join checks event status.
