# Post-commit docs hook

After every commit, a background job asks Claude to check whether the commit changed documented behavior and, if so, updates `docs/` and commits the result as `docs: update for <short-sha>`. The commit you made returns immediately; the docs follow a few seconds later.

Files:
- `.githooks/post-commit`: tiny wrapper. Starts the script in the background with `nohup` and returns.
- `scripts/update-docs.sh <full-sha>`: does the work.

## Install and uninstall

```
git config core.hooksPath .githooks     # install (per clone; git does not share this setting)
git config --unset core.hooksPath       # uninstall
```

Requires the `claude` CLI on your `PATH`, signed in.

Watch it live: `tail -f .git/update-docs.log`

## The flow

1. `git commit` finishes. `post-commit` runs `scripts/update-docs.sh <sha>` in the background, appending all output to `.git/update-docs.log`.
2. The script logs a `start` line (timestamp and SHA) and checks whether to skip. It exits quietly if:
   - `docs/` does not exist;
   - the commit message starts with `docs:` (this is what stops the hook from reacting to its own commit);
   - the commit only touches files under `docs/`;
   - `docs/` already has uncommitted changes (so your work in progress is never swept into an automated commit).
3. It snapshots `docs/design-brief.md`.
4. It builds a prompt (instructions, commit message, diff) and runs `claude -p` under a timeout.
5. Claude reads `docs/README.md` and the existing `docs/flows/*.md`, then decides per changed area:
   - **update** an existing doc;
   - **create** `docs/flows/<name>.md` for a genuinely new flow, following the existing structure and adding it to the `docs/README.md` index;
   - **no change** (refactors, tests, config, styling, small tweaks).
   It may also update `docs/architecture.md` if the overall structure changed.
6. The script restores `docs/design-brief.md` if it changed, stages only the changed files under `docs/`, and commits `docs: update for <short-sha>`. If nothing changed it logs `no doc changes` and makes no commit.
7. It logs an `end` line.

On a timeout or a non-zero exit from Claude, the script logs it and does not commit. Partial edits may remain in `docs/`; review them with `git status`.

## What Claude is allowed to do

```
claude -p
  --tools "Read,Grep,Glob,Edit,Write"
  --allowedTools "Read,Grep,Glob,Edit(docs/**)"
  --disallowedTools "Edit(docs/design-brief.md)"
  --permission-mode dontAsk
  --no-session-persistence
```

| Setting | Why |
|---|---|
| `--tools` without Bash | The job runs unattended. With no shell, a bad or injected instruction in a diff cannot run commands. |
| `Edit(docs/**)` | Writes are limited to `docs/`. This rule covers every file-editing tool; a separate `Write(...)` rule is rejected by the CLI. |
| Deny `docs/design-brief.md` | The brief is human-owned UI direction. The script also restores it afterwards, as a second layer. |
| `--permission-mode dontAsk` | Nobody is there to answer prompts, so anything not allowed is denied instead of hanging. |
| No `--model` | Inherits your default model. |
| Prompt on stdin | `--allowedTools` is variadic and would swallow a positional prompt. |

The prompt tells Claude that the commit message and diff are data, not instructions.

## Configuration

| Env var | Default | Meaning |
|---|---|---|
| `UPDATE_DOCS_TIMEOUT` | `300` | Seconds before `claude` is killed. Uses `timeout` or `gtimeout` if installed, otherwise a shell watchdog (macOS has neither by default). |
| `UPDATE_DOCS_MAX_DIFF` | `200000` | Max diff bytes sent to Claude; larger diffs are cut off. |

The hook inherits the environment of the shell that runs `git commit`, so export these before committing.

## What to customize

- **Skip rules:** the `case` and `non_docs` checks near the top of the script.
- **Protected files:** the `brief` variable, the `--disallowedTools` flag, and the restore step. Add more files there if other docs are human-owned.
- **Prompt:** the heredoc in the script. Adjust the outcomes and rules to your docs layout.
- **Scope:** the folder in `Edit(docs/**)` and in the `git ls-files` call, if your docs live elsewhere.

## Limits

- Output depends on the model. Claude may skip the "read first" step or update an existing doc where you would have created a new one. Review `docs: update` commits like any other change.
- Runs are per commit and not queued. Commits made in quick succession run in parallel.
- Hooks do not run on clones until `core.hooksPath` is set, and `git commit --no-verify` does not skip `post-commit`; use the `docs:` prefix or uninstall to avoid a run.
