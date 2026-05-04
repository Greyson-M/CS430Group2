
# Testing Documentation

## Overview

This project currently uses Playwright tests in [Front/front-app/tests](Front/front-app/tests).

Important runtime assumption:
- Playwright does **not** auto-start the frontend right now.
- The shared test helpers expect:
  - Frontend at `http://localhost:5174`
  - Backend at `http://localhost:5000`
- Those defaults come from [Front/front-app/tests/e2e.helpers.js](Front/front-app/tests/e2e.helpers.js).


## How To Run The Tests

These steps assume:
- dependencies are already installed
- your backend `.env` is already configured
- your MongoDB connection is already working

### 1. Start the backend

Open a terminal in the repo root and run:

```powershell
cd Back
venv\Scripts\activate
cd Api
flask run --no-debugger
```

Expected backend URL:
- `http://localhost:5000`

### 2. Start the frontend

Open a second terminal and run:

```powershell
cd Front\front-app
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

- the tests default to port `5174`
- `--strictPort` makes Vite fail immediately instead of silently switching to another port

Expected frontend URL:
- `http://127.0.0.1:5174`
- `http://localhost:5174`

### 3. Run all Playwright tests

Open a third terminal and run:

```powershell
cd Front\front-app
npx playwright test
```

By default, this runs all specs in [Front/front-app/tests](Front/front-app/tests) across:
- Chromium
- Firefox
- WebKit

## What Each Test File Covers

### [Front/front-app/tests/auth.spec.js](Front/front-app/tests/auth.spec.js)
This file tests the browser login experience and session behavior.

It covers:
- Vendor login through the real backend API
- Recipient login through the real backend API
- Session persistence after a page reload
- Switching app modes with the `Mode:` toggle
- Invalid login credentials showing the expected failure dialog

### [Front/front-app/tests/backend_auth.spec.js](Front/front-app/tests/backend_auth.spec.js)
This file tests backend authorization rules using Playwright's API request client.

It covers:
- `/api/validate-token` accepting a real issued JWT
- A user not being allowed to create an item for a different user ID
- A user not being allowed to delete another user's item

### [Front/front-app/tests/scanner.spec.js](Front/front-app/tests/scanner.spec.js)
This file tests the scanner and sync/audit flow.

It covers:
- Manual scanner entry rejecting malformed JWT input
- `/api/tickets/sync` marking invalid signatures as failed audit entries
- `/api/tickets/sync` rejecting an empty ledger

## Notes

- Browser-based tests depend on both the frontend and backend being live.
- API-request tests still depend on the backend.
- The helper utilities in [Front/front-app/tests/e2e.helpers.js](Front/front-app/tests/e2e.helpers.js) create unique test accounts automatically.
