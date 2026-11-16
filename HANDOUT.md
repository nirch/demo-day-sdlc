# Agentic SDLC Handout

How to give an existing project an agentic software development lifecycle with Claude Code, and how to run a feature through it.

The worked example is **Demo Day**, a real app with the kit added on top: <https://github.com/nirch/demo-day-sdlc> (branch `main`). Every "Example" link below points there. Open the file, then adapt it to your project.

The kit is an overlay. It adds files and does not change your application code.

```
CLAUDE.md
.claude/skills/{product,dev,qa}/SKILL.md
.claude/agents/{plan-reviewer,code-reviewer}.md
.githooks/post-commit
scripts/update-docs.sh
docs/            README.md, architecture.md, flows/*.md, design-brief.md
specs/features/  created by the skills, one set of files per feature
```

---

## 1. Infrastructure: make your project agentic-SDLC ready

Do this once per project, in this order. Each step builds on the previous one: the skills read `CLAUDE.md` and `docs/`, and the hook maintains `docs/`.

**Kit requirements** (not your project's requirements): the `claude` CLI on your `PATH` and signed in (the hook runs `claude -p`), a POSIX shell for the hook scripts (Git Bash or WSL on Windows), and `gh` only if you want `code-reviewer` to review pull requests.

### 1.1 CLAUDE.md

Example: [`CLAUDE.md`](https://github.com/nirch/demo-day-sdlc/blob/main/CLAUDE.md)

Claude reads this file at the start of every session. It is the project's rulebook.

- **What goes in:** overview, stack, real commands (and the folder to run each from), conventions, SDLC workflow, git rules, testing policy.
- **Customize:** the `## Stack` and `## Commands` sections first (marked `CUSTOMIZE`), then the conventions list. Describe the patterns your code already follows, not an ideal.
- **Keep it lean:** point to `docs/` instead of copying from it. One source per fact, because a stale copy gets trusted.
- **Explain each rule:** the example has a `<!-- Why: ... -->` comment per section. Claude strips HTML comments before loading, so they cost no tokens and they tell your team why the rule exists.
- **Prevents:** wrong-library suggestions, wrong syntax for your module system, commands run from the wrong folder.
- **Needs a linter and tests:** the skills run the lint and test commands listed here. If your project has none yet, add the minimum first (see 1.6).

### 1.2 Docs

Example: [`docs/`](https://github.com/nirch/demo-day-sdlc/tree/main/docs) with [`README.md`](https://github.com/nirch/demo-day-sdlc/blob/main/docs/README.md) (index), [`architecture.md`](https://github.com/nirch/demo-day-sdlc/blob/main/docs/architecture.md), [`flows/`](https://github.com/nirch/demo-day-sdlc/tree/main/docs/flows) (one file per user flow), [`design-brief.md`](https://github.com/nirch/demo-day-sdlc/blob/main/docs/design-brief.md).

These let agents learn how your app works without re-reading the whole codebase every time.

- **`architecture.md`:** layout, stack, data model, auth, layering, conventions. Links to flow docs instead of repeating them.
- **`flows/<flow>.md`:** per flow, the user-visible steps, files involved (with paths), API calls, tables touched, roles allowed.
- **`design-brief.md`:** UI direction (principles, components, copy tone, states). It is **human-owned**: the hook never edits it, and it points to your design tokens instead of copying values.
- **Bootstrap once, with Claude, then review.** Generate the first version with an interactive prompt. Use one explore subagent per flow, and have the main session write `architecture.md` and `README.md` from their findings. A starter prompt:

```
Bootstrap the project docs for this existing app. Create:
- docs/architecture.md
- docs/flows/<flow>.md, one per major flow (kebab-case names)
- docs/README.md, an index of everything in docs/

Use explore subagents in parallel, one per flow, then write architecture.md
yourself from what they find.

Flows to cover: <list your 6-10 major user flows>

architecture.md covers: <repo layout, stack, data model, auth and roles, layering, client structure, and any project rules>. Link to flow docs instead of repeating them.
Each flow doc lists: the user-visible steps, the files involved (client and server,
with paths), the API calls, the tables touched, and the roles that may do it.

Rules:
- Base everything on the code, not on assumptions. Cite file paths.
- If you cannot verify a behavior by reading the code, mark it "(unverified)".
- Document known limitations as limitations, not as bugs to fix: <list yours>.
- Do not modify any code outside docs/. Do not commit.
- docs/README.md is written last. It is an index only: one line per doc.
```

  For `design-brief.md`, use a second prompt: read `client/src` and your design tokens as the source of truth, describe principles, layout patterns, component usage, copy tone and states, and **do not copy color or size values** (point to the tokens file).
- **Review before you commit.** Wrong docs mislead every later agent. Replace anything marked "(unverified)" or confirm it.
- **Prevents:** agents re-exploring your codebase, guessing at flows, and drifting from your UI style.

### 1.3 Skills

Example: [`.claude/skills/`](https://github.com/nirch/demo-day-sdlc/tree/main/.claude/skills): [`product`](https://github.com/nirch/demo-day-sdlc/blob/main/.claude/skills/product/SKILL.md), [`dev`](https://github.com/nirch/demo-day-sdlc/blob/main/.claude/skills/dev/SKILL.md), [`qa`](https://github.com/nirch/demo-day-sdlc/blob/main/.claude/skills/qa/SKILL.md)

Each skill is one role with one job, one input and one output file.

| Skill | Does | Writes | Does not |
|---|---|---|---|
| `/product` | Turns a request into a spec: user stories, numbered acceptance criteria, UI contract, out of scope, open questions | `specs/features/<ts>-<name>.md` | write code or tests |
| `/qa` | Before implementation: Playwright tests from the acceptance criteria and UI contract. After: runs all tests, writes a test report | `client/e2e/...`, `<ts>-<name>.test-report.md` | change app code, commit, change assertions |
| `/dev` | Writes a plan and stops for approval. Then implements it with unit and integration tests for new and changed code | `<ts>-<name>.plan.md`, code, tests | commit |

- **Customize:** very little. The skills are framework-agnostic: they take frameworks, test locations and commands from your `CLAUDE.md`. Check that the test and E2E commands there are right. `qa` asks instead of guessing when `CLAUDE.md` gives no E2E command.
- **Why a UI contract:** exact routes, labels, messages and test data in the spec are what let `/qa` write tests before the pages exist.
- **Why "leave changes uncommitted":** you review the diff first, and each step becomes its own commit.

### 1.4 Subagents

Example: [`.claude/agents/`](https://github.com/nirch/demo-day-sdlc/tree/main/.claude/agents): [`plan-reviewer`](https://github.com/nirch/demo-day-sdlc/blob/main/.claude/agents/plan-reviewer.md), [`code-reviewer`](https://github.com/nirch/demo-day-sdlc/blob/main/.claude/agents/code-reviewer.md)

Reviewers with a fresh context catch what the author no longer sees.

- **`plan-reviewer`:** checks a plan against its spec, UI contract, docs and conventions, before any code. Returns `Verdict: approve | revise` and numbered issues.
- **`code-reviewer`:** reviews one diff. Findings by severity (Critical, Major, Minor), a plan-alignment note and a test-coverage note, starting with a line saying what it reviewed. Targets: `pr <number>`, `commit <sha>`, `commit <name>`, `last commit`. It reviews the diff only: it does not ask for tests of old code.
- **Read-only on purpose:** a reviewer that edits hides what it changed. `code-reviewer` has Bash only to read git history, and its prompt limits it to read-only commands.
- **You invoke them.** The `dev` skill does not call them, and `CLAUDE.md` has one line about each so Claude knows when they apply.
- **Customize:** the review checks list in each file, to match your conventions.

### 1.5 Post-commit hook

Example: [`.githooks/post-commit`](https://github.com/nirch/demo-day-sdlc/blob/main/.githooks/post-commit), [`scripts/update-docs.sh`](https://github.com/nirch/demo-day-sdlc/blob/main/scripts/update-docs.sh), [`.githooks/README.md`](https://github.com/nirch/demo-day-sdlc/blob/main/.githooks/README.md) (read this one in full)

After each commit, a background job asks headless Claude whether the commit changed documented behavior. If it did, the job updates `docs/` and makes a second commit, `docs: update for <short-sha>`.

- **Install (once per clone, git does not share it):**

```bash
git config core.hooksPath .githooks
```

- **Watch it:** `tail -f .git/update-docs.log`
- **Why a git hook and not a Claude Code hook:** it catches every commit, yours and Claude's.
- **Maintains, does not bootstrap:** if `docs/` is missing, it logs and skips. That is why 1.2 comes first.
- **Safety:** headless Claude gets Read, Grep, Glob and Edit under `docs/` only, with no shell. `design-brief.md` is restored after every run. There is a timeout (300 s). Commits whose message starts with `docs:` are skipped, which prevents a loop.
- **Your commit messages must not start with `docs:`**, or the hook skips them. It also skips when `docs/` has uncommitted changes.
- **Review its commits** like any other. The output depends on the model.
- **Customize:** docs folder, protected files, skip rules and the prompt (see "What to customize" in the hook README).

### 1.6 Test baseline (project-specific, not part of the kit)

The kit does not install tests. `/dev` and `/qa` need working commands for unit, integration and E2E tests, listed in `CLAUDE.md`. If your project has none, add the minimum first: one smoke test per level, a separate test database, and the commands in `CLAUDE.md`. Do not backfill tests for existing code; tests start with the next feature.

Example: [`06-test-baseline`](https://github.com/nirch/demo-day-sdlc/commit/bd32b68).

### Adoption checklist

- [ ] `CLAUDE.md` with your stack, real commands, conventions
- [ ] `docs/` bootstrapped, reviewed and committed (`design-brief.md` too)
- [ ] `.claude/skills/` and `.claude/agents/` copied; commands in `CLAUDE.md` verified
- [ ] Hook files copied; `git config core.hooksPath .githooks` run
- [ ] Test and lint commands work and are listed in `CLAUDE.md`
- [ ] One commit per step, on a branch, not on `main`

---

## 2. The feature cycle

One feature, nine steps. Each step ends with a review by you, then (usually) a commit. Work on a feature branch.

> **Models and modes.** Stay in regular mode, **never plan mode**: the `/dev` skill has its own plan step.
> - **Switch to Opus** (`/model opus`) for steps 3 and 4: the plan and its review.
> - **Switch back to Sonnet** (`/model sonnet`) before step 5, the implementation.
> - Everything else runs on Sonnet.

Replace `<spec>` and `<plan>` with the real paths. The skills create them under `specs/features/` with a shared prefix, `<YYYYMMDD-HHmm>-<name>`.

| # | Step | You type | Output | Then |
|---|---|---|---|---|
| 1 | Spec | `/product <feature, plus what is out of scope>` | spec | answer open questions, review, commit |
| 2 | E2E tests first | `/qa phase 1: write e2e tests for @<spec>. This is before implementation, so the tests should fail.` | failing tests | check they fail for the right reason, commit |
| 3 | Plan (**Opus**) | `/dev plan @<spec>` | plan | review, don't approve yet |
| 4 | Plan review (**Opus**) | `run the plan-reviewer on the plan`, then `apply the issues you agree with; do not re-run the reviewer` | revised plan | commit |
| 5 | Implement (**Sonnet**) | `/dev implement @<plan>` | code, unit and integration tests | review the diff |
| 6 | Commit | you commit, by hand | commit, then the hook's `docs: update` commit | read the docs commit |
| 7 | Code review | `@code-reviewer last commit` | findings by severity | read them, decide |
| 8 | Fix | `fix the Major items` (same session) | fixes, uncommitted | commit separately |
| 9 | Verify | `/qa @<spec> feature is fully implemented.` | test report | commit the report |

### Notes per step

1. **Spec.** Describe the behavior and be explicit about what is *out of scope*. `/product` reads `docs/` first, then checks the code for the labels and routes it names. It asks questions before guessing: answer them now, since each answer becomes an acceptance criterion. Read the acceptance criteria and the UI contract.
2. **E2E tests first.** Shift-left: tests exist before the feature. `/qa` runs them and confirms they fail because the feature is missing, not because of a typo. Role and label locators only.
3. **Plan.** `/dev` reads the spec, `CLAUDE.md`, `docs/` and the code, then writes the plan next to the spec. Its Coverage table maps every acceptance criterion to a change. It changes no code and waits for you.
4. **Plan review.** `plan-reviewer` runs as a subagent and returns a verdict. The verdict is advice; you decide which issues to apply. Don't loop the reviewer: one review, one revision.
5. **Implement.** Fresh `/model sonnet`. `/dev` writes the code and tests for new and changed code only, runs lint and tests, and **leaves everything uncommitted**.
6. **Commit.** Use a message that does not start with `docs:`. The commit returns at once. About 30 seconds later the hook adds `docs: update for <sha>`. On a behavior change it updates the flow docs, or creates a new flow doc. For spec, test or plan commits it logs `no doc changes`. Watch with `tail -f .git/update-docs.log`.
7. **Code review.** The reviewer reads the committed diff and skips the hook's `docs:` commits when you say `last commit`. The report starts with what it reviewed.
8. **Fix.** The fixes go in their own commit, so the review stays visible in history. Ask Claude for a commit message if you like (`give me a short commit message`) and commit by hand.
9. **Verify.** `/qa` runs the server tests, the E2E suite and lint, and writes the test report with a table of acceptance criteria to tests. It may fix a **locator**, never an **assertion**: if an assertion is wrong, go back to the spec.

### Quick reference

| Question | Answer |
|---|---|
| Which model? | Opus for plan (3) and plan review (4). Sonnet for everything else. |
| Plan mode? | No. Regular mode throughout. |
| Who commits? | You. Skills never commit. |
| What stops the hook from looping? | Commits starting with `docs:` are skipped. |
| Agent stuck or wrong? | Read the file it wrote, fix the spec or plan, and run the step again. Don't patch around a wrong plan in code. |
| Where is the history of a feature? | `specs/features/<ts>-<name>.{md,plan.md,test-report.md}` plus one commit per step. |

---

## Going further

- **Playwright MCP server:** the example runs E2E through the Playwright CLI, which is the deterministic gate. An MCP server can be added for interactive exploration, but it is not part of the kit.
- **Recovery:** every step is a commit, so `git reset --hard <commit>` returns you to any step. Run it on your own feature branch only.
