---
name: product
description: Turns a feature request into a written spec (summary, user stories, numbered acceptance criteria, UI contract, out of scope, open questions) saved in specs/features/. Use when the user describes a new feature or change and wants requirements before any planning or code. Writes no code and no tests.
---

# Product: feature request to spec

Input: a feature request from the user. Output: one spec file at
`specs/features/<YYYYMMDD-HHmm>-<kebab-case-name>.md`.

## Steps

1. **Read the ground truth.** `CLAUDE.md`, `docs/README.md`, the relevant `docs/flows/*.md`, and `docs/design-brief.md`.
   <!-- Why: the flows describe current behavior and the brief sets copy and states. A spec written without them contradicts the app or invents UI. -->
2. **Check the real code** (routes in `client/src/App.jsx`, pages, components, API routes) wherever the spec will name a route, label, heading or message.
   <!-- Why: docs drift. The UI contract is what E2E tests will assert, so a label copied from a doc instead of the code produces tests that fail for the wrong reason. -->
3. **Ask before guessing.** If the request is ambiguous, or a needed fact is not in the docs or code, ask the user. Batch the questions into one message. Do not write the spec until the blocking ones are answered.
   <!-- Why: a guessed answer becomes an acceptance criterion, then code, then tests. Cheapest to fix here. -->
   Anything non-blocking goes in "Open questions" instead.
4. **Get the timestamp** from the shell (`date +%Y%m%d-%H%M`). Do not guess it. Name the feature in kebab-case, e.g. `specs/features/20260412-0930-export-results-csv.md`.
   <!-- Why: dev and qa derive their own file names from this one. A wrong or inconsistent name breaks that link. -->
5. **Write the spec** with exactly these sections, in this order:
   - **Summary**: what and why, two or three sentences.
   - **User stories**: `As a <admin|judge>, I want ... so that ...`. Include at least one edge-case story.
   - **Acceptance criteria**: numbered (`AC1`, `AC2`, ...). Each one is observable and testable: a specific input or action and a specific result, including HTTP status where the API is involved. Cover failure and permission cases, not only the happy path.
     <!-- Why: dev and qa cite these numbers. Vague criteria ("works well") cannot be tested, so they get skipped. -->
   - **UI contract**: only what E2E tests need, no styling or layout:
     - Routes, and which role can access each (and what the other role sees or is redirected to).
     - Visible labels, headings, button text and messages, written exactly as they must appear.
     - Key states: empty, error, success (and loading if the test must wait on it).
     - Assumed test data: the events, teams, criteria, users and statuses the tests start from.
     - A `data-testid` only where no role or label can identify the element. Name it here.
     <!-- Why: qa writes tests from this section before the feature exists. Anything not listed is something the test author has to guess. -->
   - **Out of scope**: what this feature deliberately does not do, including nearby known limitations from `docs/architecture.md` that you are not fixing.
   - **Open questions**: unresolved, non-blocking decisions, each with a suggested default.
6. **Check against the docs.** Labels follow the tone and state patterns in `docs/design-brief.md`. Nothing contradicts a flow doc unless the spec says the behavior is changing.
7. **Report** the file path and list the open questions.

<!-- CUSTOMIZE: the spec sections and the AC numbering scheme. If your team already has a spec template, replace step 5 with it, but keep a testable-criteria section and a UI contract so downstream steps still have something to work from. -->
<!-- CUSTOMIZE: the roles named in user stories (admin, judge) come from docs/architecture.md. -->

## Do not

- Write or edit application code, tests, or any file other than the spec.
- Invent routes, labels, roles, endpoints or data. Take them from the code and docs, or ask.
- Put implementation details (files, tables, libraries) in the spec. That is the plan's job.
- Leave a blocking question unanswered by choosing for the user.
- Commit.
