---
name: dev
description: Implements a feature from a spec in specs/features/ in two phases. First writes an implementation plan next to the spec and stops for approval, then, once approved, implements the code plus unit and integration tests for new and changed code only. Use when a spec exists and the user wants it planned or built. Does not commit.
---

# Dev: spec to plan to implementation

Input: a spec at `specs/features/<timestamp>-<name>.md`. If the user did not name one, list `specs/features/` and ask which.

## Phase 1: plan

1. **Read** the spec in full, then `CLAUDE.md`, `docs/README.md`, `docs/architecture.md`, the relevant `docs/flows/*.md`, and `docs/design-brief.md`. Read the code you expect to change.
   <!-- Why: the plan must follow the project's layering and conventions. Those live in CLAUDE.md and docs/, not in this skill. -->
2. **Ask** if the spec leaves a blocking question (data model, auth, error paths). Do not choose silently.
3. **Write the plan** to `specs/features/<timestamp>-<name>.plan.md`, reusing the spec's exact timestamp and name.
   <!-- Why: the shared prefix is how spec, plan and test report stay linked. -->
   Sections:
   - **Approach**: a short summary and any tradeoff worth the reviewer's attention (performance, security, hard to reverse, deviation from CLAUDE.md).
   - **Coverage**: a table mapping every acceptance criterion and every UI contract item to the change that satisfies it.
     <!-- Why: a criterion without a row is a criterion that gets forgotten. -->
   - **Files to change**: path and one-line purpose each, grouped by package (server, client).
   - **Migrations**: new files, with what `down` reverses. Write "none" if none.
   - **Tests to add**: per file, per level (unit, integration), naming the criteria each covers. New and changed code only.
   - **Risks and assumptions.**
4. **Stop.** Tell the user the plan path and wait. Do not touch application code or tests.
   <!-- Why: reviewing a plan costs minutes; reviewing a wrong implementation costs hours. The user may edit the plan file or reply with changes. -->

## Phase 2: implement (only after explicit approval)

5. **Re-read the plan file** before starting. The user may have revised it. Where the plan and the spec now disagree, ask.
   <!-- Why: the approved plan is the contract, not your memory of the draft. -->
6. **Implement** exactly the approved plan, following the conventions in `CLAUDE.md` (layering, response envelope, migrations, error handling, config, styling tokens) and the component and copy rules in `docs/design-brief.md`. Use the labels and messages from the spec's UI contract verbatim.
   If you must deviate from the plan, stop and say so before doing it.
7. **Write tests for new and changed code only.**
   - **Unit tests:** every new or changed unit of logic (service method, validator, utility, hook, client service) gets a unit test covering success, failure and edge cases. Test the code you just wrote, not only the endpoint above it.
   - **Integration tests:** every new or changed API endpoint gets Supertest-style tests for success, validation, auth and role, and not-found cases.
   - Use the test framework, location and command that `CLAUDE.md` lists for each package; do not pick or install a different one. If `CLAUDE.md` lists none for a package (for example, new client logic with no client test setup), do not add one: say so, and list that code as untested in the report.
   <!-- Why: integration tests alone pass through a lot of code at once and hide which unit broke. Unit tests on what you wrote pin the logic down. No backfill keeps the diff reviewable, and using the project's own framework keeps the suite runnable by everyone. -->
   <!-- CUSTOMIZE: the test frameworks, locations and commands come from CLAUDE.md. Update them there, not here. -->
8. **Run lint and the unit and integration tests** for every package you changed, using the commands in `CLAUDE.md`. Fix failures in code you wrote. If a failure is pre-existing or outside the change, report it instead of fixing it.
   <!-- Why: "done" is only meaningful if the checks ran and you can show the result. -->
9. **Report**: files changed, migrations added, a list of each new or changed unit and endpoint with the test that covers it (name anything left untested and why), the lint and test results (exact pass/fail, including anything that did not run and why), and any deviation from the plan. Leave changes uncommitted.

## Do not

- Write application code or tests before the plan is approved.
- Treat silence or a general "ok" about something else as approval. Ask.
- Write E2E tests. Those belong to `/qa`.
- Write tests for existing code you did not change.
- Edit an applied migration, alter tables by hand, or hardcode config values.
- Edit the spec. If it is wrong or incomplete, say so and send the user back through `/product`.
- Commit or push.
