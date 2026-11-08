# Judge scores a team

A judge scores every criterion for a team, optionally adds a comment, and can resubmit to edit. See [architecture](../architecture.md).

## Roles
- Judge only, and only for events they were assigned to via [judge-joins](judge-joins.md). Admins cannot score (`requireRole('judge')` returns 403).

## User-visible steps
1. On the event detail page, judges see the team list with a "Score Team" button per team ("Edit Scores" and a "Scored" badge once scored).
2. The page loads the criteria and the judge's scored-team map. If either call fails the error is swallowed and the criteria list stays empty.
3. The scoring modal loads the judge's existing scores and comment (if any) and prefills them; errors are ignored and the form starts empty.
4. One fieldset per criterion with buttons 1–5. Unscored criteria are highlighted. The comment is optional (max 1000 characters).
5. "Submit Scores" / "Update Scores" is disabled until every criterion has a score.
6. On success the team is marked scored and the modal closes. On error the server message shows in the modal.
7. Resubmitting uses the same endpoint; there is no separate update call.

## Files
Client (`client/src/`):
- `pages/EventDetailPage.jsx`
- `components/TeamSection.jsx`, `TeamCard.jsx`, `ScoringModal.jsx`
- `services/scoreService.js`, `services/criteriaService.js`, `services/api.js`

Server (`server/src/`):
- `routes/scoreRoutes.js`
- `validators/scoreValidators.js`, `middleware/validate.js`
- `controllers/scoreController.js`
- `services/scoreService.js`
- `models/Score.js`, `TeamComment.js`, `EventJudge.js`, `Criterion.js`
- `migrations/20260326000004-create-scores.js`, `20260326000005-create-team-comments.js`, `20260326000003-create-event-judges.js`
- Criteria are read through `routes/criteriaRoutes.js` (`GET /`, admin or judge)

## API calls
Base: `/api/events/:eventId`. All need a Bearer JWT with role `judge`.
- `GET /teams/scores-summary` → `{ data: { [teamId]: true } }` for teams this judge has scored.
- `GET /teams/:teamId/scores` → `{ data: { scores: [{ criterionId, value }], comment } }` (empty scores and null comment if none).
- `PUT /teams/:teamId/scores`, body `{ scores: [{ criterionId: uuid, value: int 1–5 }], comment?: string|null (max 1000) }`
  - 200 with the same shape as the GET.
  - 400 validation array; 403 not a judge or not assigned (`"Judge is not assigned to this event"`); 404 event not found; 422 event has no criteria, a criterion does not belong to the event, or not all criteria were scored.

## Tables touched
- `scores`: unique `(team_id, criterion_id, judge_id)`, `value` constrained to 1–5 (`scores_value_range`).
- `team_comments`: unique `(team_id, judge_id)`. A blank comment deletes any existing one.
- Read: `event_judges` (assignment check), `events`, `criteria`.
- The PUT runs one transaction: an upsert per criterion plus the comment write. Whether `Score.upsert` targets the composite unique index (no `conflictFields` is set) is unverified.

## Known limitations
- Event status is not checked: judges can score or edit scores for events in any status.
- `teamId` is not validated as a UUID or as belonging to `eventId`; a team from another event would be accepted and written with this `eventId` (unverified at runtime).
- Full resubmit only; every criterion must be sent each time.
- Duplicate `criterionId` entries in one payload pass validation; the last value wins.
- Judge assignment is only checked on these score routes; `GET` events/teams/criteria are not assignment-scoped.
- Edit mode in the modal is detected from existing scores only.
