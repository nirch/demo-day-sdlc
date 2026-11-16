# Practice: Export Event Scores as CSV

Run a feature through the full agentic cycle on your own, without the instructor driving. You use the same nine steps from [HANDOUT.md](HANDOUT.md) section 2, on a new feature: **an admin downloads an event's scores as a CSV file.**

The goal is not the feature. It is to see whether you can run the cycle, judge what each step produces, and catch what the agents miss.

---

## Before you start

1. **Fork and clone.** Fork `nirch/demo-day-sdlc` on GitHub, then clone **your fork**:

```bash
gh repo fork nirch/demo-day-sdlc --clone
cd demo-day-sdlc
```

2. **Install the hook** (git does not share this setting, so it is needed in every clone):

```bash
git config core.hooksPath .githooks
```

3. **Run the app** by following the Commands section of [CLAUDE.md](CLAUDE.md): `.env`, migrate, seed, then the server and the client. This needs PostgreSQL and Node 22.12 or later.
4. **Set up the test database** once (`npm run test:db:setup` in `server/`, with `DATABASE_URL_TEST` set), and check that the existing tests pass before you change anything. A feature built on a broken baseline cannot be verified.
5. **Branch from `main`:**

```bash
git switch -c csv-export-feature main
```

Work only on this branch, and make each step its own commit.

---

## Set up some data

To check the feature by hand you need an event with scores in it. Create it through the UI:

1. Log in as the seeded admin (see `server/src/seeders/` for the account).
2. Create an event. It comes with default criteria.
3. Add at least three teams.
4. Invite two judges with the invite link, and open it in separate private windows or browsers so each judge has their own session.
5. Have each judge score every team.

Keep a second event with no scores. A feature that only works on the happy path is not finished.

The E2E tests you write in the cycle create their own data. This setup is for your own manual checks.

---

## The feature

On an event, an admin can download the event's scores as a CSV file.

**What the file contains**

- One row per team.
- Columns: team name, one column per criterion (the average score across judges), the total, and the number of judges who scored the team.
- A header row.

**Also required**

- Only an admin can download it.
- The file opens correctly in a spreadsheet, including for team names or criteria that contain commas, quotes, or line breaks.
- An event with no scores or no teams still downloads a valid file, with the header row and no crash.
- The file name tells you which event it is for.

**Out of scope** (say so in your prompt to `/product`)

- Per-judge raw scores and judge comments.
- Other formats (Excel, PDF).
- Filtering, sorting options, or choosing columns.
- Changing the existing scoring summary page's behavior.

You decide where the download action lives in the UI. `/product` will ask; the answer becomes part of the spec.

---

## The cycle

Use the generic prompts in [HANDOUT.md](HANDOUT.md) section 2. Check each step before you move on.

- [ ] **1. Spec** (`/product`): answer the open questions. Every acceptance criterion is testable, and the out-of-scope list matches the above. Commit.
- [ ] **2. E2E tests first** (`/qa`): the tests fail, and they fail because the feature is missing, not because of a typo. Commit.
- [ ] **3. Plan** (`/dev plan`, Opus): every acceptance criterion maps to a change, and the plan follows the layering in `CLAUDE.md`.
- [ ] **4. Plan review** (`plan-reviewer`, Opus): decide which issues to apply. One review, one revision. Commit.
- [ ] **5. Implement** (`/dev implement`, Sonnet): read the diff yourself before committing. Look for what the tests do not cover.
- [ ] **6. Commit**: then read the hook's `docs: update` commit. Did the docs change match what you built?
- [ ] **7. Code review** (`@code-reviewer last commit`): read every finding. Decide which are real.
- [ ] **8. Fix**: apply the findings you agree with, as a separate commit.
- [ ] **9. Verify** (`/qa`): all tests pass and the test report maps each acceptance criterion to a test. Commit the report.

---

## Done when

- [ ] You can download the CSV in the running app as an admin, for an event with scores and for one without.
- [ ] Opening the file in a spreadsheet shows the expected rows and columns.
- [ ] Server tests, E2E tests and lint pass.
- [ ] The branch has one commit per step, plus the hook's `docs:` commits.
- [ ] `docs/` describes the export. If it does not, find out why the hook skipped it.
- [ ] You can answer: what did the plan reviewer or code reviewer catch that you would have missed?

**Optional:** push the branch to your fork, open a pull request **in your fork** (not upstream), and run `@code-reviewer pr <number>`.

---

## If you get stuck

- The agent is stuck or wrong: read the file it wrote, fix the spec or plan, and run the step again. Do not patch around a wrong plan in code.
- You want to go back to an earlier step: `git reset --hard <commit>` on your own feature branch only.
- The hook did nothing: `tail -f .git/update-docs.log`, and check that your commit message does not start with `docs:`.
