# Select winner

An admin picks the winning team of an event from the scoring summary. The winner is stored on the event and shown as a "Winner" badge. See [architecture](../architecture.md).

## Roles
- Setting the winner: admin only. Server: `requireRole('admin')` (judges get 403, no token gets 401). Client: the control lives on the admin-only summary page.
- Seeing the badge: everyone who opens the event detail page, including judges.

## User-visible steps
1. On `/events/:id/scoring-summary` ([admin-views-results](admin-views-results.md)) each team row has a "Select as Winner" button next to the row (the current winner shows a "Winner" badge instead).
2. If the team has the highest average score shown on the page (ties all count as top), the winner is set immediately.
3. Otherwise a confirm dialog opens: "This team doesn't have the highest score. Are you sure you want to select it as the winner?". Cancel, Escape and backdrop clicks are ignored while the request is running.
4. On success the badge moves to the chosen team. Selecting another team replaces the winner; there is no "clear winner" action.
5. On failure the row shows "Couldn't select winner. Try again." and the dialog closes.
6. The row order and ranks do not change.
7. On the event detail page `/events/:id` the winning team's card shows the same "Winner" badge ([manage-teams](manage-teams.md)).

If several selections run at once, the page re-reads the summary afterwards to show the winner the server actually stored.

## Files
Client (`client/src/`):
- `pages/ScoringsSummaryPage.jsx`, `pages/EventDetailPage.jsx`
- `components/TeamSummaryRow.jsx`, `TeamSection.jsx`, `TeamCard.jsx`, `WinnerBadge.jsx`, `ConfirmDialog.jsx`
- `services/eventService.js` (`selectWinner`), `services/scoreService.js` (`getScoringsSummary`)
- `styles/tokens.css` (`--color-danger`), `client/tailwind.config.js` (`danger`)

Server (`server/src/`):
- `routes/eventRoutes.js`, `validators/eventValidators.js` (`selectWinnerValidators`)
- `controllers/eventController.js`, `services/eventService.js` (`selectWinner`)
- `services/scoreService.js` (`getScoringsSummaryAdmin` returns the winner)
- `models/Event.js`, `migrations/20261116000001-add-winner-team-id-to-events.js`

## API calls
`PUT /api/events/:id/winner` (Bearer JWT, admin), body `{ teamId }`
- 200 `{ data: { id, winner_team_id }, error: null }`. Idempotent: selecting the same team again succeeds.
- 400 with `{ field, message }` errors when `id` or `teamId` is not a UUID.
- 401, 403.
- 404 `"Event not found"`, or `"Team not found"` when the team does not exist or belongs to another event (also when the team is deleted mid-request).

Reads that include the winner:
- `GET /api/events/:id` returns `winner_team_id` (null by default). `GET /api/events` does not.
- `GET /api/events/:eventId/scoring-summary` returns `event.winnerTeamId`.

## Tables touched
- `events.winner_team_id` (nullable UUID, foreign key to `teams.id`, `ON DELETE SET NULL`, `ON UPDATE CASCADE`). Written by the select call; read by the event and summary endpoints.
- `teams`: read to check the team belongs to the event.
- Deleting the winning team clears the winner. Deleting an event that has a winner still works.

## Known limitations
- The winner is not checked against scores: the "highest score" check is a client-side confirmation only, and the server accepts any team of the event.
- The event status is not checked or changed; selecting a winner works in any status.
- No way to unset the winner without deleting the team.
- The page's top-score check uses the rounded averages it shows, and the summary's pooled-average ranking caveats apply ([admin-views-results](admin-views-results.md)).
