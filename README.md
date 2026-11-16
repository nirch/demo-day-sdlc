# Demo Day (with an agentic SDLC)

A judging platform for Full-Stack bootcamp demo days: admins set up events, judges score team demos on configurable criteria.

This repo is an existing app with an agentic software development lifecycle added on top (Claude Code skills, review subagents, and a post-commit docs hook). The additions are an overlay and do not change the application code. It is the worked example for the course.

- **[HANDOUT.md](HANDOUT.md):** how to add the same setup to your own project, and the step-by-step feature cycle.
- **[PRACTICE.md](PRACTICE.md):** a hands-on exercise: fork the repo and run the full cycle on a new feature (CSV export of event scores).
- **[CLAUDE.md](CLAUDE.md):** stack, commands (install, run, test, lint) and conventions. Start here to run the app.
- **[.githooks/README.md](.githooks/README.md):** the post-commit docs hook.
- **[docs/](docs/README.md):** architecture, flows and the design brief.

After cloning, install the hook (git does not share this setting):

```bash
git config core.hooksPath .githooks
```
