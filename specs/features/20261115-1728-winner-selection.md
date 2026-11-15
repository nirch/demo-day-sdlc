# Winner selection

## Summary
An admin can pick one team as the event's winner from the scoring summary page. The event page then marks that team with a "Winner" badge. The admin can change the pick at any time; an event has at most one winner. This gives the admin a way to record the outcome of the demo day in the app. If the admin picks a team that does not have the highest score, the app asks them to confirm first. The feature is otherwise deliberately minimal (see Out of scope).

## User stories
1. As an admin, I want to select a team as the winner on the scoring summary so that the result of the event is recorded.
2. As an admin, I want to see a "Winner" badge on that team's row of the event page so that the outcome is visible where I manage the event.
3. As an admin, I want to select a different team later so that I can correct my choice.
4. As a judge, I want to see the winner badge on the event page so that I know the outcome. (Read-only.)
5. Edge case: As an admin, I want the event to simply have no winner if the winning team is removed, so that no badge points at a team that no longer exists.
6. As an admin, I want a warning when I select a team that is not the top scorer so that I don't pick the wrong team by mistake, but I can still go ahead if it is intentional.
7. Edge case: As an admin, I want no warning when the team I pick is tied for the highest score, so that a tie never gets in my way.
8. Edge case: As an admin, I want selecting the current winner again to do nothing harmful, so that a double click never leaves the event with two winners or no winner.

## Acceptance criteria
- **AC1.** On `/events/:id/scoring-summary`, as admin, every team row has a "Select as Winner" control, except the current winner's row (see AC4). Before any selection, no row shows a "Winner" badge.
- **AC2.** When the admin activates "Select as Winner" on a team row whose average score equals the highest average score in the event (including a tie for the highest), no confirmation is shown, the request succeeds (HTTP 200) and that row immediately shows the "Winner" badge and no longer shows the control. No page reload is needed.
- **AC3.** After AC2, `/events/:id`, as admin, shows a "Winner" badge on the winning team's row in the Teams section and on no other team's row. The badge is still there after a page reload.
- **AC4.** The winner's row on the summary page shows the "Winner" badge instead of the "Select as Winner" control. All other rows keep the control.
- **AC5.** With team A as winner, selecting team B (HTTP 200) moves the badge: B's row shows "Winner" and A's row does not, on both the summary page and the event page. At no time are two badges shown after the response.
- **AC6.** Selecting the team that is already the winner (for example a repeated API call) returns HTTP 200 and leaves that team as the only winner.
- **AC7.** Selecting a winner does not change the event's status badge (for example Draft stays Draft) and does not change any team's score, average, rank or completeness on the summary page. The summary order is unchanged.
- **AC8.** The winner can only be set by an admin. A judge token on the select-winner API call gets HTTP 403 and the winner is unchanged. An unauthenticated call gets HTTP 401.
- **AC9.** A select-winner call for a team that does not exist, or that belongs to a different event than the one in the request, returns HTTP 404 and the winner is unchanged. A call for an event that does not exist returns HTTP 404.
- **AC10.** If the select-winner request fails, the row keeps its previous state (no badge moves), and the message "Couldn't select winner. Try again." is shown next to that row's control with `role="alert"`. The control is usable again for a retry. When the request came from the confirmation dialog (AC15), the dialog closes first and the message shows next to the control.
- **AC11.** While a select-winner request is running, that row's control shows the loading state (`aria-busy`, disabled) so it cannot be double-submitted.
- **AC12.** If the winning team is removed from the event, the event has no winner: no "Winner" badge on the event page, no badge on the summary page (if the summary still has scored teams), and no error.
- **AC13.** A judge on `/events/:id` sees the "Winner" badge on the winning team's row, and sees no "Select as Winner" control anywhere. A judge opening `/events/:id/scoring-summary` is redirected as today (`AdminRoute`).
- **AC14.** The selected winner is stored per event: events A and B can each have their own winner, and selecting a winner in A never changes B.
- **AC15.** When the admin activates "Select as Winner" on a team whose average score is lower than the highest average score in the event, a confirmation dialog opens and no request is sent yet. The dialog title is "Select <team name> as winner?" and the message is "This team doesn't have the highest score. Are you sure you want to select it as the winner?". The buttons are "Select Winner" and "Cancel".
- **AC16.** In the dialog from AC15, "Select Winner" sends the request; on success (HTTP 200) the dialog closes and the badge moves as in AC2 and AC5. "Cancel", Escape, or a click on the backdrop closes the dialog, sends no request, and leaves the winner and the badges unchanged.
- **AC17.** "Highest score" means the highest `averageScore` shown on the summary page. Teams tied at the highest average all count as top: selecting any of them shows no dialog (AC2). A team with no scores (shown as "No scores") has no average, so selecting it while any other team has scores shows the dialog.
- **AC18.** The dialog depends only on the team's score versus the top score, not on the current winner. If team A is the winner and the admin selects team B, the dialog shows if and only if B is not a top scorer.

## UI contract

### Routes and roles
| Route | Admin | Judge |
|---|---|---|
| `/events/:id/scoring-summary` | Sees "Select as Winner" controls and the "Winner" badge | Redirected by `AdminRoute` (unchanged) |
| `/events/:id` | Sees the "Winner" badge on the winner's team row | Sees the "Winner" badge on the winner's team row; no controls |

### Labels
- Control on each non-winner row of the summary: visible text **"Select as Winner"**. Its accessible name must include the team name: **"Select <team name> as winner"** (via `aria-label`), so tests can target one row.
- Badge: visible text **"Winner"**, exactly. Same text on the summary row and on the event page team row. The badge is not a status badge and does not use the Draft / Live / Completed vocabulary.
- Action error: **"Couldn't select winner. Try again."** (`role="alert"`, next to the control).
- Confirmation dialog (only for a team that is not a top scorer, see AC15): title **"Select <team name> as winner?"**, message **"This team doesn't have the highest score. Are you sure you want to select it as the winner?"**, confirm button **"Select Winner"**, cancel button **"Cancel"**. It is the existing confirm dialog (`role="dialog"`/`alertdialog` as that component provides); initial focus is on Cancel.
- No dialog when the selected team is a top scorer (including ties).
- Existing labels used by tests, unchanged: "View Scoring Summary" (event page), "Scoring Summary" (h1), "← Back to <event name>", list `aria-label` "Teams ranked by score", "Teams (N)" h2 on the event page.

### States
- **Default:** no winner; every summary row has the control; no badge anywhere.
- **Winner set:** exactly one badge; the winner's summary row has no control.
- **Confirming:** the dialog is open; nothing is saved until "Select Winner". While its request runs, the dialog's confirm button shows the loading state.
- **Loading (action):** the clicked row's control is disabled with `aria-busy="true"`. The rest of the page stays usable.
- **Error (action):** the alert above; badge and controls as before.
- **Empty summary:** when no team has scores, the summary shows only "No scores have been submitted yet. Judges need to complete scoring first." (existing). No controls are shown, so no winner can be selected from this state.
- **Event page:** a winner badge appears only on the one team row; if the event has no winner the Teams section looks as it does today.

### Assumed test data
- Admin: seeded `admin@demoday.com`.
- One event in draft status with at least three teams (for example "Team Alpha", "Team Beta" and "Team Gamma") and at least one criterion.
- At least one judge assigned to the event who has submitted scores for both teams, so the summary shows a ranked list (not the empty state). Scores are set so that Alpha has the highest average, Beta a lower one, and Gamma has the same average as Alpha (a tie). A fourth team with no scores is used for the "No scores" case in AC17. Team names are unique per test run.
- For AC13: a judge logged in through the invite link of that event.
- For AC8 and AC9: a judge token, and an event id and team id that belong to different events.

### data-testid
None required. The badge is found by its text "Winner", scoped to a team row; the control by its accessible name.

## Out of scope
- Any other tie handling. Tied top teams are all treated as top (no dialog); there is no tie-break and no tie message. The admin can pick any team, regardless of rank or score, after confirming.
- Warning about incomplete scoring (for example partly scored teams, or judges who have not finished). The "not the highest score" dialog compares averages only and ignores completeness.
- Podium, top-three view, or any ranking display change.
- Reveal step or announcement screen. The badge is shown as soon as it is set.
- Any change to event status. Events keep their current status (all stay `draft`, see `docs/architecture.md`).
- Clearing the winner without choosing another team (no "Remove winner" action).
- Selecting a winner when no team has scores (the existing empty state hides the list).
- Other confirmations (none for a top scorer), undo, history or audit of who changed the winner and when.
- Showing the winner on the event list page or event cards.
- Existing limitations that are not fixed here: pooled averages that let a partly scored team outrank a complete one, tied teams get different ranks, no auto-refresh on the summary page, and unscoped reads that let any authenticated user fetch any event (`docs/flows/admin-views-results.md`, `docs/architecture.md`).

## Open questions
None. All resolved by the product owner:
1. Judges see the badge on the event page (read-only).
2. No way to clear the winner without picking another team.
3. A team without scores can be selected (with the AC15 dialog when others have scores).
4. The badge reuses the accent-subtle pill; the text is "Winner".
5. Action error text is "Couldn't select winner. Try again."
6. Dialog wording is as in AC15 (title "Select <team name> as winner?", confirm label "Select Winner").
7. "Highest" uses the averages as displayed on the summary (rounded to one decimal), so teams showing the same average count as tied.
