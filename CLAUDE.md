# CLAUDE.md — Project Constitution

> This file is always active. It defines the project's non-negotiables: stack, structure,
> conventions, and boundaries. Every session starts here.
> For role-specific instructions, use `/dev`, `/product`, or `/qa`.

---

## Project Overview

**App:** Demo Day
**Purpose:** A judging platform for Full-Stack bootcamp demo days, allowing admins to set up events, judges to score team demos on configurable criteria, and viewers to follow results.
**Stage:** MVP
**Users:** Admin (event setup, invites), Judge (scoring, winner selection), Viewer (read-only access via invite link)

---

## Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React (Vite), React Router        |
| Styling     | Tailwind + CSS custom properties  |
| Backend     | Node.js, Express                  |
| ORM         | Sequelize                         |
| Database    | PostgreSQL                        |
| Auth        | JWT                               |
| Testing     | Jest, Supertest, Playwright       |
| Deployment  | Render (backend and frontend)     |

---

## Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Shared, reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API call functions (axios/fetch wrappers)
│   │   └── utils/           # Pure utility functions
│   └── ...
├── server/                  # Express backend
│   ├── controllers/         # Route handler logic
│   ├── routes/              # Express router definitions
│   ├── models/              # Sequelize models
│   ├── migrations/          # Sequelize migrations (source of truth for schema)
│   ├── seeders/             # Sequelize seed files
│   ├── middleware/          # Auth, error handling, validation
│   ├── services/            # Business logic, external API calls
│   └── utils/               # Shared helpers
├── CLAUDE.md                # ← You are here
├── specs/
│   └── design/
│       └── direction-brief.md   # Visual direction, approved palette, constraints
└── .claude/commands
    ├── product.md
    ├── dev.md
    ├── qa.md
    └── design.md                # Design system reference — component patterns and token rules
```

---

## Naming Conventions

- **Files:** `camelCase.js` for JS modules, `PascalCase.jsx` for React components
- **DB tables:** `snake_case`, plural (e.g. `user_profiles`)
- **Sequelize models:** `PascalCase`, singular (e.g. `UserProfile`)
- **API routes:** `kebab-case`, RESTful (e.g. `GET /api/user-profiles/:id`)
- **Env vars:** `SCREAMING_SNAKE_CASE`
- **React components:** one component per file, filename matches component name

---

## Environment Variables

Never hardcode secrets. All sensitive values live in `.env` (gitignored).
Always document new vars in `.env.example` with a placeholder value.

```
DATABASE_URL=
JWT_SECRET=
CLIENT_URL=
PORT=
NODE_ENV=
```

---

## Database Rules

- **Migrations are the source of truth** for schema. Never alter tables manually.
- Always write a `down` migration that fully reverses the `up`.
- Raw SQL in Sequelize must handle MySQL / PostgreSQL differences explicitly.
- Use transactions for any multi-step write operation.
- No `SELECT *` in production queries — always specify columns.

---

## API Design Rules

- All routes prefixed with `/api`
- Consistent response envelope:
  ```json
  { "data": ..., "error": null }
  { "data": null, "error": "message" }
  ```
- HTTP status codes must be semantically correct (don't return 200 with an error body)
- Input validation happens in middleware, not in controllers
- Controllers are thin — business logic lives in services

---

## Error Handling

- Express: always use the centralized error middleware (`server/middleware/errorHandler.js`)
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Client-facing errors must never expose stack traces or internal details
- Log errors server-side with enough context to debug

---

## Non-Negotiables

- No `console.log` left in committed code (use a logger)
- No hardcoded IDs, URLs, or magic numbers
- All async route handlers wrapped in try/catch (or an async wrapper utility)
- Auth middleware applied at the router level, not ad-hoc per route
- No direct DB calls from React — always through the API layer
- No hardcoded design values (colors, sizes, radii) — all styling goes through `client/src/styles/tokens.css` and Tailwind utility classes
