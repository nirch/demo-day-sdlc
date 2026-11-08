# Design Brief

UI direction for Demo Day. Read this before building or changing any screen.

**Source of truth is the code.** Values (colors, sizes, spacing, radii, shadows, fonts) live in `client/src/styles/tokens.css` and reach components through the Tailwind theme in `client/tailwind.config.js`. This document deliberately contains no values. Use semantic classes such as `bg-bg-surface`, `text-text-secondary`, `border-border-card`, `rounded-md`, `shadow-sm`, `text-xl`, never hex codes or pixel numbers. If a token you need is missing, add it to `tokens.css` and the Tailwind config first.

## Principles

1. **Calm and plain.** A light, quiet interface with one accent color. The accent marks the primary action, the live state and the selected state. Don't use it for decoration.
2. **Fast under pressure.** Judges score between demos on their own phones. Prefer one-tap controls over typing, large touch targets, and a primary action that is always obvious.
3. **Structured, not form-like.** Content sits in cards with clear headings and small uppercase labels. Whitespace is deliberate, not empty.
4. **No gimmicks.** No confetti, animation for its own sake, or loud colors. Motion is limited to short color, shadow and opacity transitions (`duration-fast`, `duration-base`) and loading indicators.
5. **Credible to two audiences.** Industry professionals and bootcamp students use the same screens, so keep the tone professional but friendly.
6. **Accessible by default.** Every interactive element has a visible focus ring and a text or `aria-label` name. Errors are linked to their field and announced with `role="alert"`. Modals trap focus and close on Escape.

## Layout patterns

- **App shell** (`Layout`): top nav on the surface color with a bottom border, then a centered, width-capped `main`. The nav has the wordmark on the left, then the user's identity and Log out. Judges don't get Log out.
- **Standalone pages** (login, judge join, invalid invite): a single narrow card centered on the page, with no nav. Title, optional subtitle, then the form.
- **Page header**: an `h1` (`text-3xl font-semibold tracking-tight`) with the primary action on the right, or a `StatusBadge` beside it. Admin sub-pages show a quiet "← Back to …" text link above the title.
- **Lists**: a vertical stack of cards with a consistent gap. Use `<ol>` when order matters (ranked results).
- **Event detail**: stacked sections in a fixed order: summary card, scoring summary link (admin), judge invite (admin), teams, criteria (admin), then the destructive action last. Section titles are `h2` (`text-xl`).
- **Responsive**: design for phone width first. Cards put their actions beside the content from `sm:` up and below it on small screens. The scoring modal is a bottom sheet on phones and a centered dialog from `sm:` up.
- **Role-based UI**: admin-only controls aren't shown to judges (not merely disabled). Judges see read-only team cards with a score action.

## Components

Reuse before creating. Don't restyle these inline.

### Button (`components/Button.jsx`)
- Variants:
  - `primary` is the one main action per area.
  - `secondary` is for cancel, edit, retry and navigation back.
  - `danger` is an outlined, not filled, destructive action (Remove, Delete).
- `isLoading` shows a spinner, sets `aria-busy` and disables the button. Use it for every async action so it can't be double-submitted.
- Edit and Remove sit together on a card: Edit as `secondary`, Remove as `danger`.
- Don't pass `className` to `Button`. The spread of props replaces its built-in classes. Wrap it in a container for width or position.
- Don't build button-looking links by copying Button classes. Wrap a `Button` in a `Link`.

### ConfirmDialog (`components/ConfirmDialog.jsx`)
- Required for every irreversible action (deleting an event, removing a team or criterion).
- Title names the action. Message states what will be lost. Confirm label is the verb ("Delete"), not "OK" or "Yes".
- Initial focus lands on Cancel, so a stray Enter doesn't destroy data. Pass `isLoading` while the request runs. Escape and clicking the backdrop cancel.
- Surface failures after the dialog closes, next to the button that opened it.

### Cards
- One surface style: surface background, card border, `rounded-md`, `shadow-sm`. Clickable cards add a hover shadow and a focus ring.
- `EventCard` carries the event status in a colored left border plus a `StatusBadge`. Keep the status vocabulary (Draft / Live / Completed) the same everywhere.
- Team and criteria cards put the name as a card title, supporting text in secondary color, and actions on the right. Draft events also show up/down reorder icon buttons with `aria-label`s that name the item.
- Missing optional text is shown as a muted "No description", never as a blank.

### Forms
- Use `Input` and `TextArea`. They provide the small uppercase label, accent focus border, error text and `aria-invalid`/`aria-describedby` wiring.
- Stack fields vertically with a consistent gap. The submit button sits at the end, with a little extra space above it, and is full-width on single-card screens.
- Validate on blur, validate everything on submit, and move focus to the first invalid field. Show field errors under the field and server errors in a `role="alert"` line above the submit button.
- Optional fields say so in the label ("Comment (optional)"). Use placeholders for example values, not as labels.

### Other building blocks
- `StatusBadge`: a pill for event state only.
- A "Scored" pill in the accent-subtle style shows a judge's own progress on a team card.
- Completeness chips in the results list use accent-subtle for complete and a red tint for incomplete.
- `ScoringModal`: a score is picked from 1 to 5 using toggle buttons (`aria-pressed`). The submit button stays disabled until every criterion has a score. Unscored criteria get a subtle red outline. The comment field shows a character counter only near the limit.
- Results rows (`TeamSummaryRow`): a collapsed row shows rank, name, average and completeness. Expanding shows a judge-by-criterion table and comments.

## Tone of UI copy

- Plain, short, sentence case for sentences. Title Case for button and section labels already in use ("Create Event", "Score Team"). Stay consistent with the existing screen you're editing.
- Buttons are verbs: "Create Event", "Add Team", "Copy Link", "Submit Scores". Switch to the matching verb when editing ("Update Scores", "Edit Scores").
- Confirmation text states consequences, not mood ("This will permanently remove all teams, criteria, scores, and judge assignments").
- Errors say what happened and what to do next, with no blame and no technical detail ("Failed to load events. Try again."). Never show stack traces or raw server messages that weren't written for users.
- Empty states are one friendly sentence plus the action that fixes it ("No events yet. Create your first one.").
- Transient success feedback is inline and brief ("Copied!" on the button for a couple of seconds). Don't add toast systems without a decision.
- Address the user directly ("Share this link with your judges") and avoid jargon like "token" or "payload" in the UI.

## States

Every screen or section that loads data handles all of these. Don't ship a screen with only the happy path.

| State | Pattern |
|---|---|
| **Loading (page or list)** | Skeleton placeholders shaped like the content (`SkeletonCard`, `animate-pulse`). Not a full-page spinner. |
| **Loading (action)** | `isLoading` on the button that triggered it. The rest of the screen stays usable. |
| **Empty** | Centered muted sentence plus the primary action to fill it. For read-only roles, explain what's missing without an action. For results with no scores, show a single card explaining that judges need to score first. |
| **Error (load)** | Centered secondary-color message plus a `secondary` "Try again" button that re-runs the request. For not-found, offer a way back instead. |
| **Error (action)** | Message near the control that caused it, in the error color, `role="alert"`. Keep the user's input. |
| **Error (field)** | Under the field, linked via `aria-describedby`, with the field's border switched to the error color. |
| **Disabled** | Reduced opacity and a not-allowed cursor. Prefer explaining why (e.g. "Select a score") over a silent disabled control. |
| **Read-only** | Teams, criteria and invite controls change with event status (draft vs. live/completed) and role. Hide edit controls instead of showing dead ones. |

## Known gaps in the current UI

These are observations, not rules to copy.

- Status colors, error reds and skeleton grays use raw Tailwind palette classes instead of tokens. This breaks the "no hardcoded colors" convention. Fix by adding semantic tokens (success, danger, skeleton) rather than adding more raw colors.
- Login and judge join pass `className` to `Button`, which replaces its styling (see Button above).
- Some actions are links styled like buttons or buttons nested in links (`EventDetailPage`, `EventListPage`). Prefer one consistent pattern.
- There is no shared modal shell. `ConfirmDialog` and `ScoringModal` each re-implement focus trapping.
- There is no dark mode and no large-screen layout. If either is wanted, it needs a design decision first.

## Differences from the old brief

The older `direction-brief.md` (in the original Demo Day repo) was reviewed. Where it disagrees with the current UI, this document follows the UI.

- **Values are no longer documented here.** The old brief held the canonical palette, type scale, spacing, radius and border tables. Those now live only in `tokens.css`. The old tables had drifted from the code.
- **Nav content.** The old brief had an event name in the nav. The nav now only has the wordmark, user identity and Log out.
- **Scoring input.** The old brief described a numeric score input. Scoring is now a 1–5 toggle-button group inside a modal, with a comment field.
- **Results page.** The old brief required it to hold up on a projector. The current results page is an admin-only, expandable ranked list with completeness indicators, built for a laptop or phone. The winner reveal screen is not built and is not currently planned.
- **Tone.** The old brief aimed for "graduation-day energy" and "quietly celebratory". The current UI is neutral and utilitarian. Warmth shows up in the copy, not in decoration.
- **Missing from the old brief.** Button variants, dialogs, status badges and the status-colored event cards, loading/empty/error patterns, role-based UI and mobile bottom-sheet behavior were not covered. They are documented above from the code.
- **Focus styling.** The old brief only specified the input focus border. The code also uses a focus ring with an offset on every interactive element, and a surface background on focused inputs.
- **Reference points.** Comparisons to educational platforms and the "not SaaS dashboards" line were dropped. They can't be checked against code.
