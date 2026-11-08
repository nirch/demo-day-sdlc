# Manage scoring criteria

List, add, edit, remove and reorder the criteria judges score against. See [architecture](../architecture.md).

## Roles
- Intended: admin manages, judges read.
- **Enforced:** every route requires a valid JWT (`router.use(auth)`), but only `GET /` has `requireRole('admin', 'judge')`. **POST, PUT `/reorder`, PUT `/:criterionId` and DELETE have no role check** (`server/src/routes/criteriaRoutes.js`). Any authenticated user, including a judge, can call them. This is a known limitation. The only admin restriction is in the UI (the section is rendered only for admins).

## User-visible steps
In the "Scoring Criteria (n)" section of the event detail page (admin only in the UI).
1. Criteria list in `sort_order`, with a note "Score range: 1–5 per criterion, equal weight".
2. Add, edit, remove and move up/down controls show only when the event is `draft`.
3. **Add:** inline form with name (required, max 100) and description (max 255). Saves, closes and refetches.
4. **Edit:** card becomes a pre-filled form; save then refetch.
5. **Remove:** confirm dialog, then delete and refetch. Errors show in a red banner.
6. **Reorder:** up/down arrows, optimistic swap, then the full id list is sent; on failure the list is refetched.
7. A new event starts with five default criteria ([create-event](create-event.md)).

## Files
Client (`client/src/`):
- `pages/EventDetailPage.jsx`
- `components/ScoringCriteriaSection.jsx`, `CriteriaForm.jsx`, `CriteriaCard.jsx`, `ConfirmDialog.jsx`
- `hooks/useForm.js`
- `services/criteriaService.js`, `services/api.js`

Server (`server/src/`):
- `routes/criteriaRoutes.js`
- `validators/criteriaValidators.js`, `middleware/validate.js`
- `controllers/criteriaController.js`
- `services/criteriaService.js`
- `models/Criterion.js`
- `migrations/20260324000002-create-criteria.js`

## API calls
Base: `/api/events/:eventId/criteria`.
| Call | Role check | Notes |
|---|---|---|
| `GET /` | admin, judge | 200 criteria by `sort_order`; 404 if event missing |
| `POST /` | none (auth only) | Body `{ name, description? }`; 201; 409 duplicate name |
| `PUT /reorder` | none (auth only) | Body `{ orderedIds: [uuid] }`; must match the event's criteria; 200 list |
| `PUT /:criterionId` | none (auth only) | Same body as POST; 200; 409 duplicate name |
| `DELETE /:criterionId` | none (auth only) | 204; 400 `"Cannot delete the last criterion…"` |

Errors: 400 validation, 401, 403 `"Criteria can only be modified while the event is in draft status"`, 404.

## Tables touched
- `criteria`: `id, event_id, name, description, sort_order`; unique `(event_id, name)`.
- `events`: read for the existence and draft check.
- Deleting a criterion removes its `scores` (cascade defined in the scores migration; the criterion FK line itself was not verified).

## Known limitations
- No role check on criteria write routes (above).
- No ownership check: any caller can change criteria of any draft event by id.
- Draft only is enforced in `criteriaService.assertEventDraft`; since events never leave `draft`, the lock never engages.
- `sort_order` on create (`max + 1`) and the "last criterion" delete check are not atomic, so concurrent calls could duplicate an order or remove the last criterion (unverified at runtime).
- No UUID validation on `:criterionId`; a malformed id probably yields a 500 (unverified).
- The "1–5, equal weight" note is static UI text; the 1–5 range is enforced by [judge-scores-team](judge-scores-team.md).
