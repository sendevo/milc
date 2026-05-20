# MILC

This document describes the scoring and data model that the MILC app implements. It is intended as context for any developer or coding agent working on this codebase.

---

## Overview

The app digitalizes the **MILC Guide** (*Guía Metodológica para la Inocuidad de Leche Caprina*), a methodology developed by INTA (Argentina) to help small-scale goat dairy producers assess and improve their food safety practices.

The producer answers a series of checklist questions each milking session. Over time, the app calculates a **Risk Magnitude (MR)** score for each practice and produces a rating per thematic category, along with targeted recommendations.

## UI Navigation Model

The app renders views dynamically from `nodes.json`. Each node describes a single screen with the following key fields:

| Field | Description |
|---|---|
| `id` | Unique view identifier (e.g. `"view-100"`) |
| `title` / `subtitle` | Localized screen heading and subheading (`en` / `es`) |
| `scenario` | Identifier linking this view to a scoreable practice (e.g. `"PREORD-07"`) |
| `milking-method` | Which producers see this view: `"manual"`, `"mecanico"`, or `"todos"` |
| `manual-page` | Reference page in the MILC guide (for content lookup) |
| `fields` | Array of UI field descriptors (see below) |
| `showDate` | Whether to log a timestamp when this view is shown |

### Field types

- `select` — multiple-choice question; each option has a `value` and a `target` (the next view to navigate to)
- `number_input` — numeric entry (e.g. animal count, liters of milk)
- `alert` — non-interactive message shown to the user
- `image_list` — one or more instructional images
- `text_block` — instructional text
- `bottom_navigation` — back/next navigation buttons
- `month_picker` — month selector (used during profile setup)

Navigation is entirely driven by the `target` field of each option or input. There is no implicit linear flow — the app follows whichever `target` the user's response points to.

---

## Scoring System

### 1. Severity (S)

Every scoreable practice (`scenario`) has a fixed severity level assigned by the MILC guide. Severity reflects the potential health impact on the consumer if the practice is not followed correctly.

| Level | Label | Meaning |
|---|---|---|
| S3 | High | Most practices (udder inspection, hygiene, equipment cleaning, etc.) |
| S2 | Medium | Some practices (e.g. milking parlour cleanliness) |
| S1 | Low | Lower-risk practices |

Severity is a static property of each `scenario` — it does not change based on user input. The mapping of each scenario to its severity level must be hardcoded from the MILC guide (pages referenced in each node's `manual-page` field).

### 2. Correct Execution Percentage (PEC)

PEC measures how often the producer correctly performs a given practice over the days they have used the app.

```
PEC = correct_occurrences / expected_occurrences
```

**Expected occurrences** depend on the practice's periodicity:

| Periodicity | Expected frequency |
|---|---|
| Daily | Once per app-use day |
| Every other day | Once every 2 days |
| Weekly | Once every 7 days |
| Bi-weekly | Once every 15 days |
| Monthly | Once every 30 days |

**Important:** Expected occurrences are counted only against days the user actually opened the app and answered questions. Days without any app activity do not count.

**Also important:** The periodicity clock only runs when the precondition is met. For example, the "clean the waiting pen" question only generates an expected occurrence on days when the producer has animals to milk (as recorded in their profile/daily input).

A response of "Yes" counts as a correct occurrence. A response of "No" counts as a missed occurrence. A response of "Don't know" does **not** count toward either — it triggers the educational content flow instead (navigates to the image/tutorial view).

PEC is then mapped to a categorical label:

| PEC range | Label |
|---|---|
| 91–100% | Always (*Siempre*) |
| 51–90% | Almost always (*Casi siempre*) |
| 11–50% | Sometimes (*Algunas veces*) |
| 0–10% | Never (*Nunca*) |

### 3. Risk Magnitude (MR)

MR is derived from the cross-product of the PEC category and the severity level. It is a value between 0 and 1 where 0 means no risk and 1 means maximum risk.

| PEC \ Severity | S1 (Low) | S2 (Medium) | S3 (High) |
|---|---|---|---|
| Always | 0.00 | 0.00 | 0.00 |
| Almost always | 0.01 | 0.10 | 0.37 |
| Sometimes | 0.37 | 0.77 | 0.90 |
| Never | 0.67 | 1.00 | 1.00 |

MR is computed per individual practice (per `scenario`).

### 4. Category Scores and Final Rating

Individual MR values are grouped into **8 thematic categories** and averaged:

| Category | Scope |
|---|---|
| Before milking (*Antes del ordeñe*) | Pre-milking hygiene, pen and equipment cleanliness, udder inspection |
| During milking (*Durante el ordeñe*) | Milking technique, health status of operator |
| Milk care (*Cuidado de la leche*) | Filtering, labelling, storage |
| Health (*Salud*) | Operator health conditions, brucellosis screening |
| Feed (*Alimento*) | Feed quality control |
| Facilities (*Instalaciones*) | Milking space, waiting pen, conditioning room |
| Supplies (*Insumos*) | Chemical and feed storage |
| Pests (*Plagas*) | Pest and rodent control |

The average MR per category determines the rating displayed to the user:

| Average MR | Rating | Target view |
|---|---|---|
| 0.00 – 0.10 | Excellent | `view-result-excellent` |
| 0.11 – 0.50 | Very good | `view-result-good` |
| 0.51 – 0.90 | Regular | `view-result-regular` |
| 0.91 – 1.00 | Needs improvement | `view-result-bad` |

Each `view-result-*` node also carries a recommendation message telling the producer what to focus on.

---

## Data Model

The minimum data the app must persist per user session is a log of responses:

```json
{
  "date": "2026-05-20",
  "scenario": "PREORD-07",
  "viewId": "view-100",
  "response": "yes"
}
```

From this log, PEC and MR can be derived at any time for any scenario.

Additionally, the **user profile** (set up once at first launch) must be stored:

```json
{
  "milkingMethod": "manual" | "mecanico",
  "hasMilkingParlour": true | false,
  "yearRoundProduction": true | false,
  "productionMonths": [1, 2, 3, 4, 5, 6],
  "animalCount": 12
}
```

The milking method determines which nodes are shown (`milking-method` field). Nodes with `"milking-method": "todos"` are shown to all users regardless of method.

---

## Scenario → Severity Mapping

The following is the reference mapping of each scenario code to its severity and thematic category. All values come from the MILC 2024 guide.

| Scenario | Practice | Severity | Category | Periodicity |
|---|---|---|---|---|
| PREORD-01 | Clean waiting pen | S3 | Before milking | Daily (if animals present) |
| PREORD-02 | Clean mechanical milking parlour | S3 | Before milking | Daily |
| PREORD-03 | Clean manual milking space | S3 | Before milking | Daily |
| PREORD-04 | Clean equipment and accessories | S3 | Before milking | Daily |
| PREORD-05 | Identify and separate sick animals | S3 | Before milking | Daily |
| PREORD-06 | Hand washing before milking | S3 | Before milking | Daily |
| PREORD-07 | Udder inspection and fore-stripping | S3 | Before milking | Daily |
| PREORD-08 | Ensure teats are clean before milking | S3 | Before milking | Daily |
| ORD-02-03 | Operator health and hygiene | S3 | During milking | Daily |
| ORD-07 | Full equipment cleaning after milking | S3 | During milking | Daily |

> **Note:** This table is incomplete — the full MILC guide defines ~34 scoreable scenarios across all 8 categories. The table above covers only the scenarios present in the current `nodes.json`. The full mapping should be completed as new views are added.

---

## Node Navigation Example: PREORD-07 (Udder Inspection)

The following shows how the navigation tree in `nodes.json` implements the udder inspection practice:

```
view-36  →  Enter animal count
view-100 →  "Did you check udders?"
              Yes / No  →  view-110
              Don't know → view-38 (shows tutorial image)

view-110 →  "Did you find mastitis symptoms?"
              Yes        → view-42  (enter sick animal count)
              No         → view-111 (all clear — start milking)
              Don't know → view-38  (tutorial)

view-42  →  Enter number of sick animals
              → view-37 (alert: milk those animals last, discard milk)

view-111 →  Alert: "Ready! Start milking."
```

The **scoreable moment** is at `view-110`. A "Yes" answer to "Did you check udders?" (view-100) combined with any answer to the mastitis question constitutes a completed execution of PREORD-07. A "No" at view-100 is a missed execution. A "Don't know" is not scored.

---

## Profile Setup Flow

On first launch, the user completes a one-time profile setup. The flow is:

```
view-217 → "Do you produce milk all year round?"
             Yes → view-220
             No  → view-218 → month picker → view-220

view-220 → Enter number of dairy animals → view-24

view-24  → Select milking method:
             Manual     → user-profile (setup complete)
             Mechanical → view-107

view-107 → "Do you have a milking parlour?"
             Yes / No   → view-28 (setup complete)
```

The answers collected here drive which nodes are shown throughout the app (`milking-method` filter) and when periodicity counters should be active (production months, animal count).

---

## Key Implementation Notes

- **"Don't know" answers** navigate to educational content (image or text tutorial) and then continue the flow. They must not be stored as either a correct or incorrect response for PEC calculation purposes.
- **Periodicity and production months** mean that not every scenario generates an expected occurrence every day. Before computing PEC, filter the date range to days that are both app-use days and within the producer's declared production season.
- **Milking method filtering** must be applied at the navigation level, not just at display. Nodes with `"milking-method": "mecanico"` should never be reached by a user who selected manual milking during setup (and vice versa).
- **The `scenario` field is the join key** between a node and the scoring system. Multiple nodes can share the same `scenario` — they all contribute to the same practice's PEC. Nodes with `scenario: "-"` are informational or setup screens and are never scored.
- **The result views** (`view-result-*`) are the final output of a full session review. They are not shown after every session but rather when the user explicitly requests their logs/results.


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
[TODO: Complete]
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


## Node Editor

Open `editor/index.html` in a browser (no build step required). The editor connects
to Firebase using credentials you supply via the UI (or by dropping in your `.env`
file). Features:

[TODO: Complete]


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
