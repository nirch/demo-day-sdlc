# Admin views results

An admin sees the ranked scoring summary for an event. Scores come from [judge-scores-team](judge-scores-team.md). See [architecture](../architecture.md).

## Roles
- Admin only. Server: `requireRole('admin')`. Client: `AdminRoute`. Judges get 403 from the API and are redirected by the client. There is no creator check: any admin can view any event.

## User-visible steps
1. On `/events/:id`, the admin clicks "View Scoring Summary".
2. `/events/:id/scoring-summary` shows a skeleton, then either "Failed to load scoring summary" with Retry, or "No scores have been submitted yet…" when no team has scores.
3. Otherwise a ranked list of teams. Each row shows rank (list position), team name, average score out of 5 (or "No scores") and a Complete / "Incomplete (x/y judges)" badge (shown only if the event has judges).
4. Clicking a row expands it (one at a time): a criteria-by-judge table ("—" for missing values, "Missing" under judges who scored nothing) and each judge's comment.
5. "← Back to <event name>" returns to the event.

## Files
Client (`client/src/`):
- `App.jsx`, `components/AdminRoute.jsx`, `components/ProtectedRoute.jsx`
- `pages/EventDetailPage.jsx`, `pages/ScoringsSummaryPage.jsx`
- `components/TeamSummaryRow.jsx`
- `services/scoreService.js` (`getScoringsSummary`), `services/api.js`

Server (`server/src/`):
- `routes/scoringsSummaryRoutes.js`
- `controllers/scoreController.js` (`getScoringsSummaryAdmin`)
- `services/scoreService.js`
- `models/Event.js`, `Team.js`, `Criterion.js`, `Score.js`, `TeamComment.js`, `User.js`, `EventJudge.js`

## API calls
`GET /api/events/:eventId/scoring-summary` (Bearer JWT, admin)
- 200 `{ data: { event: { id, name }, criteria: [{ id, name, sortOrder }], judges: [{ id, name }], teams: [{ id, name, averageScore | null, totalScores, expectedScores, isComplete, scores: [{ criterionId, judgeId, value }], comments: [{ judgeId, comment }] }] } }`
- 401, 403, 404 `"Event not found"`.

## Tables touched (all read only)
`events`, `users` and `event_judges` (assigned judges), `criteria`, `teams`, `scores`, `team_comments`.

Computation is in JavaScript (`scoreService.getScoringsSummaryAdmin`), not SQL:
- `averageScore` is the mean of all of a team's score rows (pooled across judges and criteria), rounded to one decimal; null when there are no scores.
- `expectedScores` = criteria count × judge count; `isComplete` = expected > 0 and total equals expected.
- Teams are sorted by `averageScore` descending, null last. Ties keep name-ascending order (teams are loaded ordered by name). The client uses list position as the rank, so tied teams get different ranks.

## Known limitations
- Averages are pooled over score rows, not per judge, so a partly scored team can outrank a fully scored one.
- Ties are not shared ranks, and rounding before sorting turns near-ties into exact ties.
- The scores query is not filtered to current judges or criteria; scores from a judge no longer in the list still count toward `totalScores` but have no column (there is no judge removal in the app, so this only matters for direct database changes).
- If a judge has several comments for a team the client keeps the last; the schema allows one per judge and team.
- No auto-refresh, pagination or export.
- A separate judge-only route, `GET /teams/scores-summary` (`scoreRoutes.js`), has a similar name but is unrelated (it is part of the judge scoring flow).
- A malformed `eventId` probably yields a 500 (unverified).
