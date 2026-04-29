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
│   └── nodes.json       # Survey node definitions with inline bilingual text
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

Survey content is defined in `src/survey/nodes.json`. Each **node** has:

- `id` — unique string identifier
- `title` — bilingual text object `{ "en": "...", "es": "..." }`
- `subtitle` — bilingual text object (optional)
- `fields` — array of `select`, `number_input`, `image_list`, `alert`, or `month_picker` field descriptors
- `next` — `null` (terminal), a node ID string (unconditional), or `{ field, map }` (conditional branching)

All human-readable text lives inline in `nodes.json` as `{ "en": "...", "es": "..." }` objects on every text field. The `t()` helper in `src/model/index.js` resolves them using the active i18next language with English as fallback.

## Adding a New Survey Node

1. Add the node definition to `src/survey/nodes.json` with inline bilingual text:
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

## Internationalisation

UI strings (buttons, labels common to all pages) are in `src/i18n.js`. Survey-specific strings are embedded directly in `src/survey/nodes.json`. Both support `es` and `en`.

