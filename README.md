# MILC

A mobile-first PWA that guides goat farmers through best practices for healthy milk production. Built with React + Vite.

## Features

- **Guided surveys** — step-by-step decision trees covering pre-milking, during milking, milk care, health, feeding, and facilities
- **Conditional branching** — survey flow adapts based on user answers
- **Authentication** — email/password accounts or anonymous guest access via Firebase Auth (with reCAPTCHA)
- **User profiles** — stored in Firebase Realtime Database
- **Internationalisation** — Spanish and English via i18next (default: Spanish; persisted in `localStorage`)
- **PWA** — installable, works offline, portrait-optimised layout
- **Node editor** — standalone browser-based editor (`/editor`) for creating and editing survey nodes, with Firebase sync and JSON import/export

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Component library | MUI (Material UI) v7 |
| Routing | React Router v7 |
| i18n | i18next + react-i18next |
| Backend / Auth | Firebase v12 (Auth + Realtime Database) |
| Build tool | Vite 6 |
| PWA | vite-plugin-pwa |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Project Structure

```
src/
├── assets/icons/          # SVG/PNG icons used in the menu
├── components/
│   ├── FormCard.jsx       # Reusable form wrapper card
│   ├── MenuCircle.jsx     # Circular icon button for the main menu
│   ├── ProtectedRoute.jsx
│   ├── ViewContainer.jsx  # Page layout shell with gradient header
│   └── survey/
│       ├── AlertBlock.jsx    # Informational/warning display field
│       ├── BottomNavigation.jsx
│       ├── ImageList.jsx
│       ├── MonthPicker.jsx
│       ├── NumberInput.jsx
│       ├── Select.jsx        # List of options
│       └── SurveyStep.jsx    # Renders a single survey node
├── contexts/
│   ├── AuthContext.jsx    # Firebase auth state + helper methods
│   └── SettingsContext.jsx  # Language + theme, persisted in localStorage
├── hooks/
│   └── useSurveyNodes.js  # Syncs nodes from Firebase with localStorage caching
├── model/
│   ├── actions.js         # Side-effect runners (log, save_to_storage, …)
│   └── index.js           # resolveNext(), t() bilingual helper
├── pages/
│   ├── Config.jsx
│   ├── Info.jsx
│   ├── Login.jsx
│   ├── MainMenu.jsx
│   ├── Profile.jsx
│   ├── Register.jsx
│   ├── SurveyPage.jsx     # Route handler for /survey/:nodeId
│   └── Welcome.jsx
├── survey/
│   └── nodes.json         # Bundled fallback — Firebase /survey is the live source
├── theme/                 # Per-page MUI sx style objects
├── firebase.js
├── i18n.js                # i18next setup (en + es)
└── theme.js               # MUI theme factory (light / dark)

editor/                    # Standalone survey-node editor (plain HTML + JS)
├── index.html
├── app.js
└── style.css

e2e/                       # Playwright end-to-end tests
├── helpers/
│   └── firebase.js        # Firebase Auth REST mock + loginTestUser helper
├── storageState.json      # Pre-seeds milc_language=en for all tests
├── welcome.spec.js
├── login.spec.js
├── register.spec.js
├── protected-routes.spec.js
├── main-menu.spec.js
├── survey.spec.js
├── config.spec.js
├── profile.spec.js
└── info.spec.js
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Firebase project with **Authentication** (email/password + anonymous) and **Realtime Database** enabled

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_APP_VERSION=1.0.0
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_RECAPTCHA_SITE_KEY=...
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview   # preview the built output locally
```

### Deployment

```bash
firebase deploy --only hosting
```

## Testing

### Unit tests (Vitest)

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Unit tests live under `src/model/__tests__/`.

### End-to-end tests (Playwright)

The E2E suite runs against the local Vite dev server. On first run, Playwright will
start the server automatically.

```bash
# Install Playwright browsers (one-time setup)
npx playwright install chromium

# Run all E2E tests (headless)
npm run test:e2e

# Open the interactive Playwright UI
npm run test:e2e:ui

# View the last HTML report
npm run test:e2e:report
```

**How the E2E tests work without a real Firebase backend:**

All Firebase Auth REST API calls (`identitytoolkit.googleapis.com`,
`securetoken.googleapis.com`) and Realtime Database HTTP calls are intercepted via
`page.route()` in `e2e/helpers/firebase.js`. This means:

- No Firebase project credentials are needed to run the tests.
- Tests are fast and deterministic.
- The app falls back to the bundled `nodes.json` for survey data.

The `e2e/storageState.json` file pre-seeds `milc_language=en` in `localStorage` so
every test runs in English regardless of the system default.

## Survey System

Survey content is defined in the Firebase Realtime Database under the `/survey` key
and is automatically synchronised to the app at runtime via the `useSurveyNodes` hook
(`src/hooks/useSurveyNodes.js`). The bundled `src/survey/nodes.json` acts as a
versioned fallback.

### Versioning with `timestamp`

Both the bundled `nodes.json` and the cached copy stored in `localStorage` carry a
`timestamp` field (Unix second). On every app load, `useSurveyNodes` compares the two:

| Condition | Behaviour |
|---|---|
| No cache | Load bundled `nodes.json`, write to cache |
| `cache.timestamp >= bundled.timestamp` | Use cache (may be newer Firebase data) |
| `cache.timestamp < bundled.timestamp` | Discard stale cache, load bundled version |

Firebase data received at runtime always overwrites the cache, so a Firebase-sourced
update will remain preferred until a newer bundled version is shipped.

When editing nodes with the editor, `nodes.timestamp` is updated to the current Unix
second on every save or delete, so exported files and Firebase-synced data always
carry an accurate version stamp.

### Node loading order

| Priority | Source | When used |
|---|---|---|
| 1 | `localStorage` (`milc_survey_nodes`) | Cache is fresh (timestamp ≥ bundled); app is immediately interactive |
| 2 | Bundled `nodes.json` | Cache is absent or older than the bundled file |
| 3 | Firebase Realtime DB `/survey` | Fetched on every mount; updates cache and live state |

### Updating survey content

Use the **node editor** (`/editor`) to create or edit nodes with a visual UI, then
export `nodes.json` or push directly to Firebase. All online clients receive the
update in real time; offline clients pick it up on next reconnect.

To force a re-sync from the bundled fallback, clear the `milc_survey_nodes` key in
DevTools → Application → Local Storage.

### Node shape

Each **node** has:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `title` | `{ en, es }` | Page heading |
| `subtitle` | `{ en, es }` | Sub-heading (optional) |
| `showDate` | `boolean` | Show current date in the header (optional) |
| `icon` | `string` | Filename of an icon image (optional) |
| `fields` | `Field[]` | Input / display fields (see below) |
| `next` | `null \| string \| { field, map }` | Routing: terminal / unconditional jump / conditional branch |

**Field types:** `select`, `number_input`, `month_picker`, `image_list`, `alert`, `bottom_navigation`

All human-readable text lives inline as `{ "en": "...", "es": "..." }` objects. The
`t()` helper in `src/model/index.js` resolves them using the active i18next language
with English as fallback.

## Node Editor

Open `editor/index.html` in a browser (no build step required). The editor connects
to Firebase using credentials you supply via the UI (or by dropping in your `.env`
file). Features:

- Create, edit, and delete nodes with a visual form
- Supports all field types: select, number input, month picker, image list, alert
- Conditional `next` branching with a visual map builder
- Import `nodes.json` from disk; export the current state back to `nodes.json`
- Push all changes to Firebase with one click
- Dark / light theme toggle
- Every save or delete automatically bumps `nodes.timestamp`

## Adding a New Survey Node

1. Open the editor or add the node directly to `/survey` in the Firebase console.
   The entry should follow this shape:
   ```json
   "my-node": {
     "id": "my-node",
     "title": { "en": "My question", "es": "Mi pregunta" },
     "fields": [{
       "id": "my_field",
       "type": "select",
       "options": [
         { "value": "yes", "label": { "en": "Yes", "es": "Sí" } }
       ]
     }],
     "next": null
   }
   ```
2. Link it from another node's `next` field.
3. Export from the editor and replace `src/survey/nodes.json` so the bundled
   fallback stays in sync, then bump the `timestamp` value.

## Internationalisation

UI strings (buttons, labels, error messages) are in `src/i18n.js`. Survey-specific
strings are embedded directly in the node JSON. Both support `es` and `en`.

The user's preferred language is stored in `localStorage` under `milc_language` and
applied on app startup via `SettingsContext`.


## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Component library | MUI (Material UI) v7 |
| Routing | React Router v7 |
| i18n | i18next + react-i18next |
| Backend / Auth | Firebase v12 (Auth + Realtime Database) |
| Build tool | Vite 6 |
| PWA | vite-plugin-pwa |

## Project Structure

```
src/
├── assets/icons/        # SVG/PNG icons used in the menu
├── components/
│   ├── FormCard.jsx     # Reusable form wrapper card
│   ├── MenuCircle.jsx   # Circular icon button for the main menu
│   ├── ProtectedRoute.jsx
│   ├── ViewContainer.jsx  # Page layout shell with gradient header
│   └── survey/
│       ├── AlertBlock.jsx   # Informational/warning display field
│       ├── Select.jsx       # List of options
│       └── SurveyStep.jsx   # Renders a single survey node
├── contexts/
│   └── AuthContext.jsx  # Firebase auth state + helper methods
├── pages/
│   ├── Login.jsx
│   ├── MainMenu.jsx
│   ├── Register.jsx
│   ├── SurveyPage.jsx   # Route handler for /survey/:nodeId
│   └── Welcome.jsx
├── survey/
│   └── nodes.json       # Bundled fallback — Firebase /survey is the live source
├── hooks/
│   └── useSurveyNodes.js  # Syncs nodes from Firebase with localStorage caching
├── firebase.js
├── i18n.js              # i18next setup (en + es)
└── theme.js             # MUI theme
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Firebase project with **Authentication** (email/password + anonymous) and **Realtime Database** enabled

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_APP_VERSION=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_RECAPTCHA_SITE_KEY=...
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview   # preview the built output locally
```

### Deployment

```bash
firebase deploy --only hosting
```

## Survey System

Survey content is defined in the Firebase Realtime Database under the `/survey` key
and is automatically synchronised to the app at runtime via the `useSurveyNodes` hook
(`src/hooks/useSurveyNodes.js`). The bundled `src/survey/nodes.json` acts as a
hard-coded fallback and is no longer the authoritative source.

### Node loading order

| Priority | Source | When used |
|---|---|---|
| 1 | `localStorage` (`milc_survey_nodes`) | Available synchronously from the previous session — the app is immediately interactive even before Firebase responds |
| 2 | Bundled `nodes.json` | Only on the very first visit (no cache yet) or after the cache has been cleared |
| 3 | Firebase Realtime DB `/survey` | Fetched on every mount; updates the `localStorage` cache and the live state whenever the server data changes |

### How the sync works

1. On mount, `useSurveyNodes` initialises React state with the `localStorage` cache
   (or `nodes.json` if the cache is empty).
2. It subscribes to `/survey` via `onValue` (Firebase Realtime Database SDK).
3. When the snapshot arrives, the hook overwrites both the in-memory state and the
   `localStorage` cache with the fresh data.
4. While offline, the hook keeps the last-cached copy; the survey remains fully usable.

### Updating survey content

Edit the `/survey` entry in the Firebase console (or via the Admin SDK). All online
clients will receive the update in real time; offline clients will pick it up next time
they reconnect.

The `localStorage` cache (`milc_survey_nodes`) can be cleared in DevTools to force a
re-sync from the bundled fallback on the next load.

Each **node** has:

- `id` — unique string identifier
- `title` — bilingual text object `{ "en": "...", "es": "..." }`
- `subtitle` — bilingual text object (optional)
- `fields` — array of `select`, `number_input`, `image_list`, `alert`, or `month_picker` field descriptors
- `next` — `null` (terminal), a node ID string (unconditional), or `{ field, map }` (conditional branching)

All human-readable text lives inline as `{ "en": "...", "es": "..." }` objects on every
text field. The `t()` helper in `src/model/index.js` resolves them using the active
i18next language with English as fallback.

## Adding a New Survey Node

1. Add the node definition to the `/survey` key in the Firebase Realtime Database
   (Firebase console → Realtime Database → edit or import JSON).
   The entry should follow this shape:
   ```json
   "my-node": {
     "id": "my-node",
     "title": { "en": "My question", "es": "Mi pregunta" },
     "fields": [{
       "id": "my_field",
       "type": "select",
       "options": [
         { "value": "yes", "label": { "en": "Yes", "es": "Sí" } }
       ]
     }],
     "next": null
   }
   ```
2. Link it from another node's `next` field.
3. Also update `src/survey/nodes.json` with the same entry so the bundled fallback
   stays in sync (important for first-load offline scenarios).

## Internationalisation

UI strings (buttons, labels common to all pages) are in `src/i18n.js`. Survey-specific strings are embedded directly in `src/survey/nodes.json`. Both support `es` and `en`.

