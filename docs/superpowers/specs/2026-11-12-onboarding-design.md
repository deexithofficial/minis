# Minis Onboarding — Design Spec

## Context

This is a greenfield project. The product is "Minis" — a tiny-games swipe
feed app. We are implementing only the **onboarding flow**: first app open
through account creation, character setup, and the notification
pre-prompt. No other product surface (the game feed itself, game pages,
profile, discover) is in scope.

The visual design comes from a Claude Design Canvas artifact
(`https://claude.ai/artifact/80d5dbb5-5a67-4a50-a9f9-f7149318f33c`), boards
`OnboardingOpen`, `OnboardingWelcome`, `OnboardingConfetti`,
`OnboardingPlan`, `OnboardingAfter`. Visual language: near-black backgrounds
(`#0F1014` app background, `#212124` screen background), a lime primary
accent (`#C6F24E`), violet as the Welcome screen's canonical background
(`#6A47F5`), 'Cal Sans'-styled display type, 56px pill buttons
(`border-radius: 999`), dot-style step indicators, blob mascot
illustrations.

## Decisions made during brainstorming

- **React Native tooling:** Expo (managed), TypeScript.
- **Backend:** Node + Express (TypeScript), Postgres. Postgres runs in
  Docker locally via `docker-compose.yml`; the Express API runs on the
  host (`npm run dev`) against it, reading `DATABASE_URL` and `JWT_SECRET`
  from environment. No containerization of the API in this stage.
- **Scope cut — first-game/feed screen:** the design's "first game as a
  guest, with coach marks" step requires a real swipeable game feed. That
  is out of scope entirely. The implemented flow goes straight from
  Interests to Save-progress.
- **Social sign-in:** "Continue with Apple" / "Continue with Google" are
  rendered to match the design but are disabled — tapping shows a
  "coming soon" notice. Only "Continue with email" calls the backend.
- **Guest accounts are real backend accounts.** `POST /auth/guest` creates
  a `users` row with `is_guest = true` and returns a JWT immediately.
  Age, interests, and character are written to that same row as the user
  moves through onboarding. Signing up later (`POST /auth/signup` with the
  guest JWT attached) upgrades that same row in place (adds email +
  password, sets `is_guest = false`) rather than creating a second row —
  so nothing entered as a guest is lost.
- **Fabricated data:** the design's "Save your progress" screen shows a
  score/coins/best-score summary earned from the first game. Since the
  first-game screen is out of scope, we have no real numbers to show
  there, and we are not inventing sample stats. The implemented
  Save-progress screen keeps the card's sign-up content (headline, the
  three continue options, "Not now") and drops the stats row.
- **Mascot art:** the user supplied the real mascot illustrations as 8
  PNGs (1024×1024, transparent background), saved to
  `mobile/src/assets/mascots/`:
  `green-thinking.png`, `yellow-happy.png`, `blue-pointing.png`,
  `coral-celebrating.png`, `pink-shy.png`, `lightblue-sad.png`, plus two
  spares not used by this flow (`lavender-sad-spare.png`,
  `mint-worried-spare.png`, kept for a possible future screen). Mapping
  to screens, matching the design's own alt-text naming where it exists
  ("green blob thinking", "blue blob pointing", "yellow blob", "pink blob
  asking nicely", "blue blob sad"):
  - Welcome (trio): `yellow-happy`, `coral-celebrating`, `pink-shy`
  - Age check: `green-thinking`
  - Interests: `blue-pointing`
  - Save progress: `coral-celebrating`
  - Make your character: `yellow-happy`
  - Notifications: `pink-shy`
  - Age-blocked: `lightblue-sad`
- **Typography:** the design's Google Fonts link for `'Cal Sans'` does not
  correspond to a real Google Fonts family. We bundle the actual
  open-source Cal Sans (`CalSans-SemiBold.otf`, published by cal.com at
  github.com/calcom/font, licensed under the SIL Open Font License,
  Version 1.1 — not MIT as earlier noted here; the full license text is
  bundled alongside the font at
  `mobile/src/assets/fonts/LICENSE.txt`) as a local font file loaded via
  `expo-font`, and use the system sans-serif as fallback until fonts
  finish loading. The bundled `.otf` is actually a later TrueType build
  of the font (version 2.012) substituted for the original OpenType/CFF
  release referenced above, per the Task 6 sourcing ruling — same family
  and weight, a newer upstream build.

## Screen flow

```
Welcome ──Start playing──► AgeCheck ──≥13──► Interests ──► SaveProgress ──► Character ──► Notifications ──► Home (stub)
   │                           │
   │                        <13 ▼
   │                      AgeBlocked ──Check my birth year──► AgeCheck
   │
   └──I have an account──► SignIn ──► Home (stub)
```

- **Welcome** — violet (`#6A47F5`) background, blob-trio illustration
  (PNG mascots — see "Mascot art" above), "Minis" wordmark, headline
  "Tiny games. Endless swipes.",
  subtext "Swipe, play, repeat. No sign-up to start.". Primary pill
  "Start playing" calls `POST /auth/guest`, stores the returned JWT,
  navigates to AgeCheck. Text link "I have an account" navigates to
  SignIn (no API call).
- **AgeCheck** — back button (to Welcome), 3-dot step indicator (dot 1
  active), headline "When were you born?", subtext "We use this to show
  games that suit you. It stays private.", a scrollable year picker.
  "Continue" computes age from the selected birth year; if the resulting
  age is **< 13**, navigate to AgeBlocked instead of Interests. On a valid
  age, `PATCH /users/me` with `birthYear`, then navigate to Interests.
- **Interests** — back button (to AgeCheck), 3-dot step indicator (dot 2
  active), headline "What do you like?", subtext "Pick a few. You can
  change this later.", a wrapping grid of toggle chips: Runner, Puzzle,
  Casual, Arcade, Racing, Cozy, Word, Strategy, Sports, Rhythm (selection
  is optional, any number of chips, including zero). "Continue" and
  "Skip" both `PATCH /users/me` with the current `interests` array —
  whatever is selected at the moment the button is pressed, which is
  `[]` only if nothing was picked — and navigate to SaveProgress.
- **SaveProgress** — headline "Save your progress", subtext "Keep your
  score, coins and favourites on any phone.". Three stacked buttons:
  "Continue with Apple" and "Continue with Google" are rendered but
  disabled — pressing either shows a toast/alert "Coming soon". "Continue
  with email" expands an inline form (email, password, confirm password)
  whose submit calls `POST /auth/signup` with the stored guest JWT in the
  `Authorization` header; on success, store the returned (upgraded) JWT
  and navigate to Character. "Not now" navigates to Character without
  calling the backend (the user stays a guest).
- **Character** — back button (to SaveProgress), 3-dot step indicator
  (dot 3 active), headline "Make your character", a row of 3 selectable
  mascot-look swatches (colors: lime `#C6F24E`, pink `#FF9FD0`, sky
  `#7DB8FF`), a name text field (placeholder "Pick a name"). "Continue"
  `PATCH /users/me` with `characterLook` and `characterName` (name may be
  empty), navigates to Notifications. "Skip for now" navigates to
  Notifications with no API call.
- **Notifications** — headline "Keep your streak alive", subtext "Want a
  nudge when your streak is about to end? That is all we will send.", a
  static mock notification preview card, "Turn on reminders" requests the
  OS notification permission via `expo-notifications` and then `PATCH
  /users/me` with `notificationsOptIn: true` regardless of the OS
  permission result (the opt-in reflects the user's in-app choice; a
  denied OS permission is a separate concern the app does not resolve
  here), then navigates to Home. "Not now" sets `notificationsOptIn:
  false` via the same PATCH and navigates to Home.
- **AgeBlocked** — headline "Not quite yet", subtext "This app is for
  players 13 and over. Come back when you are older, we will be here.".
  "Check my birth year" navigates back to AgeCheck. "Close" navigates
  back to Welcome.
- **SignIn** — email + password fields, "Continue" calls `POST
  /auth/login`; on success store the returned JWT and navigate to Home.
  On failure (401), show an inline error message "Incorrect email or
  password." and stay on the screen.
- **Home** — a stub screen (not part of the visual design): plain text
  confirming onboarding is complete and showing the signed-in state
  (guest vs. account email). Exists only so the flow has a terminal
  screen to land on; it is explicitly out of scope beyond that.

## Backend

### Data model

One table, created by `backend/db/init.sql` (mounted into the Postgres
container's `/docker-entrypoint-initdb.d/`, so it runs once on first
container start):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  password_hash TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT TRUE,
  birth_year INTEGER,
  interests TEXT[] NOT NULL DEFAULT '{}',
  character_look TEXT,
  character_name TEXT,
  notifications_opt_in BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));
```

The uniqueness constraint is a case-insensitive **index** (`lower(email)`), not a
plain column `UNIQUE`, so `Foo@x.com` and `foo@x.com` collide at the database
level regardless of which code path (fresh signup or guest-upgrade) inserts
or updates the row — a plain case-sensitive column constraint would miss the
upgrade path, since that path's conflict check is a caught constraint
violation rather than an explicit pre-query.

No migration framework is introduced at this stage — there is one table,
and `init.sql` is the whole schema. (Noted as a thing to revisit once the
schema grows past this feature.)

### Auth

JWTs are signed with `JWT_SECRET` (env var, required — the server refuses
to start without it), `HS256`, 30-day expiry, payload `{ sub: <user id>,
isGuest: <bool> }`. Passwords are hashed with `bcrypt` (cost factor 10).
There is no refresh-token flow in this stage — a user re-authenticates
(or starts a new guest session) after the 30 days lapse.

### Endpoints

All request/response bodies are JSON. Authenticated endpoints require
`Authorization: Bearer <token>`; `requireAuth` middleware verifies the JWT
and attaches `{ id, isGuest }` to the request, responding `401` on a
missing/invalid/expired token.

- **`POST /auth/guest`** — body: none. Creates a `users` row with
  `is_guest = true` and all other fields at their defaults. Response
  `201`: `{ token, user }` where `user` is the public user shape below.
- **`POST /auth/signup`** — body: `{ email, password }` (both required,
  `password` min length 8; respond `400` with a field-level message
  otherwise). If a valid guest JWT is present in `Authorization`, upgrade
  that row in place: set `email`, `password_hash`, `is_guest = false`.
  Otherwise create a fresh row with `is_guest = false`. If `email` is
  already taken, respond `409` with `{ error: "Email already in use" }`.
  Response `200`: `{ token, user }` (a new token reflecting `isGuest:
  false`).
- **`POST /auth/login`** — body: `{ email, password }`. Looks up the user
  by email; `401` with `{ error: "Invalid email or password" }` if not
  found or the password does not match. Response `200`: `{ token, user
  }`.
- **`GET /users/me`** — requires auth. Response `200`: the public user
  shape for the authenticated user.
- **`PATCH /users/me`** — requires auth. Body is a partial update, any
  subset of `{ birthYear, interests, characterLook, characterName,
  notificationsOptIn }`; unknown keys are ignored. Updates `updated_at`.
  Response `200`: the public user shape after the update.

**Public user shape** (never includes `password_hash`):

```ts
{
  id: string
  email: string | null
  isGuest: boolean
  birthYear: number | null
  interests: string[]
  characterLook: string | null
  characterName: string | null
  notificationsOptIn: boolean | null
  createdAt: string
}
```

### Errors

All error responses are `{ error: string }` with an appropriate 4xx/5xx
status. Validation errors (missing/malformed fields) are `400`.
Authentication failures are `401`. Conflicts (duplicate email) are `409`.
Unhandled errors are logged server-side and respond `500` with a generic
`{ error: "Internal server error" }` (no stack trace leaked to the
client).

## Mobile app

### Structure

```
mobile/
  App.tsx                          — loads fonts, wraps providers, renders navigator
  app.json                         — Expo config
  src/
    theme/
      colors.ts                    — design-token color constants
      typography.ts                — font family + type-scale constants
    assets/fonts/CalSans-SemiBold.otf
    components/
      BlobMascot.tsx                — PNG mascot image, props: name, size
      PillButton.tsx                — primary/secondary pill button
      ProgressDots.tsx              — step indicator, props: stepCount, activeIndex
      Chip.tsx                      — toggle chip, props: label, selected, onPress
    state/
      OnboardingContext.tsx         — provider + reducer + typed hook
      onboardingReducer.ts          — pure reducer + helpers (exported for unit tests)
    api/
      client.ts                    — fetch wrapper (base URL, auth header, JSON, error parsing)
      auth.ts                      — guestSignIn, signup, login
      users.ts                     — getMe, updateMe
    storage/
      tokenStorage.ts               — save/get/clear JWT via expo-secure-store
    navigation/
      OnboardingStack.tsx            — native-stack navigator, typed param list
    screens/
      WelcomeScreen.tsx
      AgeCheckScreen.tsx
      InterestsScreen.tsx
      SaveProgressScreen.tsx
      CharacterScreen.tsx
      NotificationsScreen.tsx
      AgeBlockedScreen.tsx
      SignInScreen.tsx
      HomeScreen.tsx
```

### State

`OnboardingContext` holds: `token: string | null`, `user: PublicUser |
null`, plus setters (`setSession(token, user)`, `clearSession()`) and
derived helpers used by screens (e.g. `isUnderMinimumAge(birthYear:
number): boolean`, minimum age constant `13`). Screen-local form state
(selected chips, text field values) lives in each screen component, not
in the shared context — only session state crosses screens.

### Networking

`EXPO_PUBLIC_API_URL` (Expo public env var) configures the backend base
URL, defaulting to `http://localhost:4000` for local development against
the Docker Postgres + host-run backend. `client.ts` throws a typed
`ApiError { status, message }` on non-2xx responses so screens can show
the server's `error` message inline.

## Testing

- **Backend:** Jest + Supertest, run against the real Postgres container
  (`docker compose up -d` must precede `npm test`). Each test file clears
  the `users` table it touches in `beforeEach`. Covers: guest creation,
  signup (fresh and guest-upgrade paths), duplicate-email conflict,
  login (success and failure), `GET/PATCH /users/me` (including partial
  updates and the 401 when unauthenticated).
- **Mobile:** Jest + `@testing-library/react-native` for component and
  hook-level tests; no end-to-end/device tests in this stage. Covers the
  reducer/helpers (`isUnderMinimumAge`, interest toggling), `api/client`
  (header attachment, error parsing), and per-screen behavior that
  branches (age-based navigation, chip toggling, form validation,
  disabled social buttons).

## Out of scope (explicit)

- The swipeable game feed, game pages, profile, discover — everything
  outside onboarding.
- Real Apple/Google OAuth.
- Password reset / email verification.
- Refresh tokens / token rotation.
- Push notification delivery (only the permission request + opt-in flag).
- A migration framework (single `init.sql` is enough for one table).
