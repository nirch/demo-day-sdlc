# Test report: Winner selection

Spec: `specs/features/20261115-1728-winner-selection.md`
Verdict: **PASS**. All levels green, all 18 acceptance criteria covered, no locator changes.

## Results per level
| Level | Command | Passed | Failed | Not run |
|---|---|---|---|---|
| Unit (`eventService.selectWinner.test.js`, `errorHandler.test.js`) | `npm test` in `server/` (Jest, `--runInBand`) | 25 total across 4 suites (unit and integration share one command) | 0 | 0 |
| Integration (`winner.test.js`, `auth.smoke.test.js`, supertest) | same command as above | included above | 0 | 0 |
| E2E | `npm run test:e2e` in `client/` (Playwright, chromium) | 27 | 0 | 0 |

Runs used `demoday_test` (`DATABASE_URL_TEST` set; ports 3000 and 5173 were free).
Lint (no errors): client 8 warnings, server 1 warning.

## Acceptance criteria
| AC | Covering E2E test(s) | Status |
|---|---|---|
| AC1 | AC1 control on every row, no badge | pass |
| AC2 | AC2 + AC4 + AC7 | pass |
| AC3 | AC3 badge on event page, survives reload | pass |
| AC4 | AC4 winner row shows badge instead of control | pass |
| AC5 | AC5 badge moves, never two badges | pass |
| AC6 | AC6 repeat select returns 200, one winner | pass |
| AC7 | AC2 + AC4 + AC7, AC3, AC7 summary unchanged | pass |
| AC8 | AC8 judge 403, AC8 unauthenticated 401 | pass |
| AC9 | AC9 unknown team, other-event team, unknown event: 404 | pass |
| AC10 | AC10 failed request; AC10 failure after confirming | pass |
| AC11 | AC11 disabled and `aria-busy` while running | pass |
| AC12 | AC12 winning team removed | pass |
| AC13 | AC13 judge sees badge, no controls, redirected | pass |
| AC14 | AC14 per-event winner | pass |
| AC15 | AC15 dialog wording, focus on Cancel, no request yet | pass |
| AC16 | AC16 confirm; Cancel, Escape and backdrop (3 tests) | pass |
| AC17 | AC17 tie gets no dialog; "No scores" gets dialog | pass |
| AC18 | AC18 dialog depends on score, not current winner | pass |

UI-contract states also covered: empty summary has no controls; dialog confirm button shows the loading state.

## Locator changes
None.

## Failures
None.

## Gaps and notes
- No criterion is uncovered.
- Unit and integration tests both run under the single `npm test` command, so their counts are not separable in the Jest summary.
- The admin controls on the summary page are only exercised in Chromium (the only configured project).
- Existing lint warnings (e.g. `react-hooks/set-state-in-effect`) are not part of this feature's scope.
