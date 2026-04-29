# MILC

A mobile-first PWA that guides goat farmers through best practices for healthy milk production. Built with React + Vite.

## Features

- **Guided surveys** — step-by-step decision trees covering pre-milking, during milking, milk care, health, feeding, and facilities
- **Conditional branching** — survey flow adapts based on user answers
- **Authentication** — email/password accounts or anonymous guest access via Firebase Auth
- **User profiles** — stored in Firebase Realtime Database
- **Internationalisation** — Spanish and English via i18next (default: Spanish)
- **PWA** — installable, works offline, portrait-optimised layout

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

