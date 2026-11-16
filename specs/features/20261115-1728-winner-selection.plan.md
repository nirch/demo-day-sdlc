# Winner selection: implementation plan

Spec: `specs/features/20261115-1728-winner-selection.md`
E2E (already written by `/qa`, test-first): `client/e2e/winner-selection.spec.js`

## Approach
Store the winner as a nullable column `events.winner_team_id` (FK to `teams.id`, `ON DELETE SET NULL`). One column per event gives "at most one winner" (AC5, AC6) and per-event independence (AC14) for free. The FK's `SET NULL` clears the winner in the database when the winning team is deleted (AC12), so no extra code in `teamService.remove`.

API: `PUT /api/events/:id/winner` with body `{ teamId }`, admin only. This is the path and body the E2E tests already assume, so we use it as is. It is idempotent: setting the same team again is a plain 200 (AC6). The service checks that the event exists and that the team belongs to that event (404 otherwise, AC9), then updates the one column.

Reads:
- `GET /api/events/:id` adds `winner_team_id` to its attributes (only the single-event read; `GET /api/events` is unchanged), so the event page (admin and judge) can show the badge (AC3, AC13). Judges can already read this endpoint.
- `GET /api/events/:eventId/scoring-summary` adds `winnerTeamId` to its `event` object, so the summary page knows the current winner without a second request.

Client: the summary page holds `winnerTeamId` in state and updates it from the PUT response, so the badge moves with no reload (AC2, AC5). It decides whether to show the confirm dialog by comparing the team's `averageScore` with the highest non-null `averageScore` in the loaded summary (AC15, AC17, AC18). These are the rounded values the page shows, as the product owner decided (open question 7). The event page passes `winner_team_id` down to `TeamSection` and `TeamCard`, which render a "Winner" pill next to the team name.

Tradeoffs worth a look:
- **Circular FK.** `teams.event_id → events` and now `events.winner_team_id → teams`. Deleting an event cascades to its teams, whose `SET NULL` then targets the event row being deleted. Postgres handles this (the row is already gone, so the update touches nothing), but an integration test covers "delete an event that has a winner" to prove it.
- **No draft check.** The spec doesn't restrict winner selection to draft events, and events never leave draft anyway (`docs/architecture.md`). No `assertEventDraft` here.
- **Race with team delete.** If the team is deleted between the service's check and the update, the FK fails. The service catches `SequelizeForeignKeyConstraintError` and returns 404 `"Team not found"`, not a 500.
- **Concurrent clicks on two rows.** AC11 needs the other rows to stay enabled while one request runs, so two requests can be in flight. Loading is tracked per row: `selectingTeamIds` is a set of team ids with a request in flight, and each control stays busy until its own request settles. Each success is applied as it arrives (`winnerTeamId = that team`). There is no stale-response guard, because ignoring a success can leave the page out of sync with the server. Write order on the server can still differ from response order. So when the last in-flight request settles and more than one ran at once (counted in a ref), the page silently re-reads the summary and takes `event.winnerTeamId` from it. The page then matches the stored winner. The server is last write wins.
- **Dialog dismissal while its request runs.** `ConfirmDialog` disables only Cancel while `isLoading`; Escape and a backdrop click still call `onCancel`. The page passes an `onCancel` that does nothing while the dialog's team is in `selectingTeamIds`. The dialog then closes only when the request settles (success closes it, failure closes it and shows the alert, as in AC10). `ConfirmDialog` itself is not changed.
- **Error color token.** Existing alerts use the raw `text-red-500` (a known gap in `docs/design-brief.md`). The brief says to fix this with a semantic token, not more raw colors. The plan adds one `--color-danger` token and uses it only in the new alert. Existing alerts are not touched.
- **Malformed ids.** Validators return 400 for a non-UUID `:id` or `teamId`, instead of the 500 that other routes probably give today. AC9 uses valid UUIDs, so it still gets 404.

## Coverage

| Spec item | Change that satisfies it |
|---|---|
| AC1: control on every row, no badge before selection | `TeamSummaryRow` renders "Select as Winner" when `!isWinner`; `winnerTeamId` is null by default |
| AC2: top scorer → no dialog, 200, badge at once, control gone | `ScoringsSummaryPage.handleSelect` sends directly when `isTopScorer`; on success sets `winnerTeamId` in state |
| AC3: badge on the event page, survives a reload | `winner_team_id` stored in DB; added to `EVENT_ATTRIBUTES`; `EventDetailPage → TeamSection → TeamCard` render the pill |
| AC4: winner row shows badge instead of control | `TeamSummaryRow`: `isWinner ? badge : control` |
| AC5: selecting B moves the badge, never two | single column overwritten; client state holds one `winnerTeamId` |
| AC6: same team again → 200, one winner | `eventService.selectWinner` is a plain update, no "already winner" error |
| AC7: status, scores, rank, order unchanged | service only writes `winner_team_id`; summary sort untouched; badge and control sit outside the rank/average/completeness spans |
| AC8: judge 403, unauthenticated 401 | route uses `auth` (from `router.use`) then `requireRole('admin')` |
| AC9: unknown team, team from another event, unknown event → 404 | `selectWinner` checks `Event.findByPk` and `Team.findOne({ id, event_id })`; FK-error catch |
| AC10: failure → state kept, alert next to control, retry works, dialog closes first | `handleSubmit` catch: close dialog, add the team to `errorTeamIds`; row shows `<p role="alert">Couldn't select winner. Try again.</p>` under the control; `winnerTeamId` changes only on success. A row's error clears when that row's control is activated again, and all errors clear whenever the summary loads (so there is no stale alert, see the AC12 E2E) |
| AC11: loading state on the row control | team id in `selectingTeamIds` → `Button isLoading` on that row only, until that row's own request settles |
| AC12: winning team removed → no winner, no error | FK `ON DELETE SET NULL`; both reads then return null |
| AC13: judge sees badge, no controls; summary redirect | `TeamCard` badge doesn't depend on role; controls exist only on the admin-only summary page; `AdminRoute` unchanged |
| AC14: winner per event | column on `events`; service scopes the team to `:id` |
| AC15: non-top team → dialog with exact wording, no request yet | `handleSelect` sets `confirmTeam`; `ConfirmDialog` with the spec's title, message and labels |
| AC16: confirm sends and closes; Cancel / Escape / backdrop send nothing | `onConfirm={() => handleSubmit(confirmTeam)}`; `onCancel` clears `confirmTeam` when no request is running for it, and does nothing while one is (`ConfirmDialog` already handles Escape and the backdrop) |
| AC17: ties count as top; "No scores" gets the dialog when others have scores | `isTopScorer = team.averageScore !== null && team.averageScore === topAverage` |
| AC18: dialog depends only on score | `isTopScorer` doesn't read `winnerTeamId` |
| UI: control text and `aria-label` "Select <team name> as winner" | `Button variant="secondary"` with `aria-label` in `TeamSummaryRow` (secondary, because it repeats on every row and the accent is kept for the Winner badge) |
| UI: badge text exactly "Winner", accent-subtle pill, not a `StatusBadge` | new `WinnerBadge.jsx` (`bg-accent-subtle text-accent rounded-pill`), used in both places |
| UI: action error text with `role="alert"` | `TeamSummaryRow` error line |
| UI: dialog title, message, "Select Winner" / "Cancel", focus on Cancel | `ConfirmDialog` (`variant="primary"`, since this isn't destructive); it already focuses Cancel |
| UI state: Confirming, confirm button loading | `ConfirmDialog isLoading={selectingTeamIds.has(confirmTeam.id)}` |
| UI state: Loading (action), rest of page usable | only the clicked row's control is busy; the others stay enabled |
| UI state: Empty summary, no controls | existing `hasNoScores` branch unchanged; controls live only inside the list |
| UI state: event page without a winner looks as today | badge renders only when `team.id === winnerTeamId` |
| UI: existing labels unchanged | no edits to those strings |

## Files to change

### Server (`server/src/`)
- `migrations/20261116000001-add-winner-team-id-to-events.js`: new; adds `events.winner_team_id`.
- `models/Event.js`: add the `winner_team_id` column (UUID, nullable, references `teams.id`).
- `validators/eventValidators.js`: add `selectWinnerValidators` (`param('id').isUUID()`, `body('teamId').isUUID()`).
- `routes/eventRoutes.js`: `router.put('/:id/winner', requireRole('admin'), selectWinnerValidators, validate, eventController.selectWinner)`.
- `controllers/eventController.js`: `selectWinner`, a thin handler returning 200 `{ data: { id, winner_team_id }, error: null }`.
- `services/eventService.js`: `selectWinner(eventId, teamId)` with the 404s and FK-error handling; add `winner_team_id` to the `findById` attributes only (`findAll`, the list, is unchanged).
- `services/scoreService.js`: `getScoringsSummaryAdmin` loads `winner_team_id` and returns `event.winnerTeamId`.

### Client (`client/src/`)
- `services/eventService.js`: `selectWinner(eventId, teamId)` → `PUT /events/:id/winner`.
- `components/WinnerBadge.jsx`: new; the "Winner" pill.
- `components/TeamSummaryRow.jsx`: new props `isWinner`, `isSelecting`, `hasSelectError`, `onSelectWinner`. The header becomes a flex container with the existing toggle `<button>` and, as a sibling (not nested in the button), the badge or the control (`Button variant="secondary"`) plus the error line.
- `pages/ScoringsSummaryPage.jsx`: state `winnerTeamId`, `selectingTeamIds` (Set), `errorTeamIds` (Set), `confirmTeam`; refs for the in-flight count and the "overlapped" flag; `topAverage`, `isTopScorer`, `handleSelect` (clears that row's error), `handleSubmit` (applies each success, then re-reads the summary silently if requests overlapped); a guarded dialog `onCancel`; `fetchSummary` clears `errorTeamIds`; renders `ConfirmDialog`.
- `components/TeamCard.jsx`: new prop `isWinner`; renders `WinnerBadge` next to the name.
- `components/TeamSection.jsx`: new prop `winnerTeamId`, passed to each `TeamCard` as `isWinner`.
- `pages/EventDetailPage.jsx`: passes `event.winner_team_id` to `TeamSection`.
- `styles/tokens.css` and `client/tailwind.config.js`: add `--color-danger` and the `danger` color (used as `text-danger` for the new alert).

### Docs
None in this change. The post-commit docs hook updates `docs/` after the commit.

## Migrations
- `server/src/migrations/20261116000001-add-winner-team-id-to-events.js`
  - `up`: `addColumn('events', 'winner_team_id', { type: UUID, allowNull: true, references: { model: 'teams', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' })`.
  - `down`: `removeColumn('events', 'winner_team_id')`. This also drops the FK constraint, which fully reverses `up`.

## Tests to add
Server only. `CLAUDE.md` lists no client unit-test framework, so none is added (see Risks). No E2E: `/qa` already wrote `client/e2e/winner-selection.spec.js`.

**`server/src/__tests__/eventService.selectWinner.test.js`** (unit, `jest.mock('../models')`)
- Event and team found → updates `winner_team_id`, returns `{ id, winner_team_id }` (AC2, AC6).
- Event missing → throws status 404 "Event not found", no update (AC9).
- Team missing or in another event (`findOne` with `event_id` returns null) → 404 "Team not found", no update (AC9). Asserts that `findOne` is called with `{ where: { id: teamId, event_id: eventId } }`.
- Update throws `SequelizeForeignKeyConstraintError` → 404 "Team not found" (race).
- Other DB error → rethrown as is.

**`server/src/__tests__/winner.test.js`** (integration, supertest against `demoday_test`, unique data per test)
- `PUT /api/events/:id/winner`
  - Admin, valid team → 200, `data.winner_team_id` equals the team id; `GET /api/events/:id` returns it (AC2, AC3). `GET /api/events` items have no `winner_team_id` (list unchanged).
  - Select A then B → B stored (AC5). Select A twice → 200 both times, A stored (AC6).
  - Judge token → 403, winner unchanged; no token → 401 (AC8).
  - Unknown team, team from another event, unknown event → 404, winner unchanged (AC9).
  - Missing or non-UUID `teamId`, non-UUID `:id` → 400 with `[{ field, message }]`.
  - Two events keep separate winners (AC14).
  - Event `status` stays `draft` after selection (AC7).
- Team removal and cascade
  - `DELETE` the winning team → `GET /api/events/:id` has `winner_team_id: null`, and the summary has `event.winnerTeamId: null` with 200 (AC12).
  - `DELETE` an event that has a winner → 200 (circular FK check).
- `GET /api/events/:eventId/scoring-summary` (changed)
  - Returns `event.winnerTeamId` (null by default, the team id after selection); the teams' order and averages are unchanged by selection (AC7).

## Risks and assumptions
- **API path comes from the E2E file**, not the spec (the spec names none). If the spec owner wants a different path, both the plan and `winner-selection.spec.js` change.
- **The PUT response is minimal** (`{ id, winner_team_id }`), and the client uses only the status. Snake_case matches the other `/api/events` responses; the summary's `winnerTeamId` is camelCase to match that endpoint's existing shape.
- **Untested client logic:** `isTopScorer`, the per-row loading set and the re-read after overlapping requests, the guarded dialog cancel, error clearing, and the dialog flow in `ScoringsSummaryPage`, plus `TeamSummaryRow`, `TeamCard`, `WinnerBadge` and `services/eventService.selectWinner`. No client unit-test setup exists; the E2E suite covers them through `/qa`.
- **"Highest" uses rounded averages**, so two teams at 4.25 and 4.24 both show 4.3 and count as tied (PO decision 7, and consistent with the known rounding limitation).
- The migration timestamp `20261116000001` sorts after every existing migration.
- `docs/` (architecture data model, flow docs for results, event detail and manage teams) will need the new column, endpoint and badge. That is left to the post-commit docs hook.
- Assumes `npm run test:db:setup` has been run or that `db:migrate` will be run against `demoday_test` before the tests, so the new column exists there.
