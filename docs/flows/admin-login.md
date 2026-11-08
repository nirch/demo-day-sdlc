# Admin login

An admin signs in with email and password and receives a JWT. See [architecture](../architecture.md) for auth and roles.

## Roles
- Admin. The endpoint itself does not check the role: any `users` row with an email and a matching password can get a token. Judges have no email or password, so in practice they cannot use it (they enter through [judge-joins](judge-joins.md)).

## User-visible steps
1. Open `/login`. The page shows Email and Password fields.
2. Fields validate on blur and on submit. Email is required and must look like an email; password is required. An invalid form sends no request and focuses the first bad field.
3. On success the token and user are stored in `localStorage` and the app navigates to `/` (the event list).
4. On any failure (wrong credentials, network error, 400, 500) the page shows "Invalid email or password".
5. A user who already has a token and opens `/login` is redirected to `/`.
6. "Log out" in the nav clears `token`, `user` and `judgeEventId` from `localStorage` and goes to `/login`. It is hidden for judges.

## Files
Client (`client/src/`):
- `pages/LoginPage.jsx`
- `context/AuthContext.jsx` (`login`, `logout`, rehydration from `localStorage`)
- `services/authService.js`
- `services/api.js` (adds the Bearer token; on a 401 from any URL except `/auth/login` clears storage and redirects to `/login`)
- `components/ProtectedRoute.jsx`, `components/AdminRoute.jsx`, `components/Layout.jsx`
- `App.jsx` (route table)

Server (`server/src/`):
- `routes/authRoutes.js`
- `validators/authValidators.js`, `middleware/validate.js`
- `controllers/authController.js`
- `services/authService.js`
- `models/User.js`
- `middleware/auth.js`, `middleware/requireRole.js` (used by other routes after login)
- `seeders/20260323000001-admin-user.js` (creates the admin user)

## API calls
`POST /api/auth/login`
- Body: `{ email, password }`. Email is trimmed, must be an email, and is normalized; password is required (no length rule).
- 200: `{ data: { token, user: { id, email, role } }, error: null }`. The JWT payload is `{ id, email, role }` with a 24h expiry.
- 400: validation errors as `[{ field, message }]`.
- 401: `"Invalid email or password"` (same message for unknown email and wrong password).

## Tables touched
- `users` (read only). The password column is excluded by default scope and loaded with the `withPassword` scope for this lookup.

## Known limitations
- No rate limiting, lockout or refresh token. The 24h JWT is the only session control.
- Logout only clears client storage; the token is not invalidated server-side.
- After login the client always goes to `/`. A non-admin who somehow logs in is bounced by `AdminRoute` to `/events/<judgeEventId>` or `/login`.
- The 401 interceptor does not remove `judgeEventId` (logout does).
- Runtime behavior was not executed; everything above is from reading the code.
