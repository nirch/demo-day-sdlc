---
name: qa
description: Verifies a feature against its spec in specs/features/. Before implementation, writes Playwright E2E tests from the acceptance criteria and UI contract and confirms they fail because the feature is missing. After implementation, runs unit, integration and E2E tests and writes a short test report. Use for test-first E2E authoring or final verification. Does not modify application code or commit.
---

# QA: spec to E2E tests to verification

Input: a spec at `specs/features/<timestamp>-<name>.md`. If the user did not name one, list `specs/features/` and ask which. Decide the phase from the user's request: before or after implementation.

## Phase 1: E2E tests before implementation

1. **Read** the spec, then `CLAUDE.md` for where E2E tests live and how to run them. Skim `docs/flows/*.md` for the affected flows.
   If `CLAUDE.md` gives no E2E location or command, ask the user. Do not invent one or install Playwright config.
   <!-- Why: tests in an unknown place or run by a guessed command may never be collected by the suite. -->
2. **Write Playwright tests** only from the acceptance criteria and the UI contract. Keep a comment or test title that cites each criterion number (`AC3`).
   - Locate elements with `getByRole` and `getByLabel` (and `getByText` for plain messages). Use `getByTestId` only for ids the UI contract names.
     <!-- Why: role and label locators test what users see and survive refactors. Test ids couple tests to markup. -->
   - Use the exact labels, headings and messages from the contract.
   - Set up the contract's "assumed test data" explicitly. Each test creates what it needs and does not depend on another test's leftovers or on run order.
   - Cover failure, empty and permission cases the criteria list, not just the happy path.
   <!-- CUSTOMIZE: E2E directory, naming, and base URL or fixtures come from CLAUDE.md and your Playwright config. -->
3. **Run the new tests** with the command from `CLAUDE.md` and confirm two things:
   - **Collected:** every test you wrote shows up in the run.
   - **Failing for the expected reason:** the feature is missing (element, route or message not found, wrong status for a missing endpoint), not a setup or syntax error (import error, bad config, app not running, login helper broken, timeout waiting for the server).
   <!-- Why: a test that fails for the wrong reason proves nothing, and will "pass" for the wrong reason later. -->
   Fix setup and syntax problems in your tests. If the cause is environment (server down, database missing), report it and ask.
4. **Report**, per test: collected yes/no, failure reason, and whether that reason is the expected one. List any criterion you could not turn into a test and why. Stop.

## Phase 2: verify after implementation

5. **Run all three levels** with the commands in `CLAUDE.md`: unit, integration, E2E. Run every package that has tests. A level with no command in `CLAUDE.md` is reported as "not run: no command", never skipped silently.
6. **If E2E tests fail on locators only** (element not found because of a name or role mismatch, with the behavior itself working), you may fix the locator in the test. Never change an assertion, expected text, status code or test data to get a pass. Record every locator change (file, old, new, why).
   <!-- Why: a locator is how a test finds the thing. An assertion is what the spec says must be true. Editing assertions turns tests into a mirror of the code. -->
7. **If an assertion fails**, or an assertion needs to change, do not fix it. Report the failure with the criterion number and evidence, and send the user back through the spec (`/product`), or to `/dev` if the code is wrong.
8. **Write the test report** to `specs/features/<timestamp>-<name>.test-report.md`, reusing the spec's exact timestamp and name. Keep it short:
   - Result per level (unit, integration, E2E): command run, passed / failed / not run counts.
   - Acceptance criteria table: `AC#`, covering test(s), status.
   - Locator changes made (or "none").
   - Failures: criterion, test, one-line cause.
   - Uncovered criteria or gaps.
9. **Tell the user** the report path and the overall verdict.

## Do not

- Modify application code, migrations or config, or the unit and integration tests `/dev` wrote. Report problems instead.
- Change an assertion, expected value or test data to make a test pass.
- Mark a test `.skip`, `.only`, or `fixme`, or loosen a check, to get green.
- Write E2E tests from the implementation. Use the spec only.
- Report a pass you did not see. Quote real command results.
- Commit.
