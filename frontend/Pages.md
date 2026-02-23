# Frontend Pages & Routes

This file is shared between the frontend and backend teams.
It defines all pages, who can see them, what they show, and which API calls they make.
Any changes to routes or API endpoints must be agreed by both teams first.

---

## Table of Contents

1. [Route Map](#route-map)
2. [API Sync Status](#api-sync-status)
3. [Auth — How Tokens Are Stored](#auth--how-tokens-are-stored)
4. [Access Rules](#access-rules)
5. [Page Layouts](#page-layouts)
6. [Pages](#pages)
7. [URL Filters](#url-filters)
8. [Browser Tab Titles](#browser-tab-titles)
9. [Filter Persistence](#filter-persistence)
10. [Dangerous Actions](#dangerous-actions)

---

## Route Map

### Anyone (not logged in)

| URL | Page | Note |
|---|---|---|
| `/` | Dashboard | Redirects to `/login` if not logged in |
| `/login` | Login | Redirects to `/` if already logged in |
| `/register` | Sign Up | — |
| `/error/forbidden` | Access Denied | Shown when user doesn't have permission |
| `/error/system` | Server Error | Shown when the server is down or crashes |
| `/*` | Not Found | Any URL that doesn't exist |

> If the server returns a **401 error** (session expired) — the user is redirected to `/login`.

### Logged-in users (all roles)

| URL | Page | USER | TECH_SUPPORT | ADMIN |
|---|---|:---:|:---:|:---:|
| `/stations` | Station list | ✓ | ✓ | ✓ |
| `/stations/:stationId` | Station details | ✓ | ✓ | ✓ |
| `/sessions/current` | Current charging session | ✓ | ✓ | ✓ |
| `/sessions/history` | Charging history | ✓ | ✓ | ✓ |
| `/account/profile` | My profile | ✓ | ✓ | ✓ |
| `/account/settings` | Settings | ✓ | ✓ | ✓ |

### Tech support only

| URL | Page | Note |
|---|---|---|
| `/support/dashboard` | Operations overview | Also visible to ADMIN |
| `/support/logs` | Error logs | Also visible to ADMIN |
| `/support/stations` | Station controls | Also visible to ADMIN |
| `/support/sessions` | Active sessions | Also visible to ADMIN |

### Admin only

| URL | Page |
|---|---|
| `/admin/dashboard` | Admin home |
| `/admin/users` | Manage users |
| `/admin/stations` | Manage stations |
| `/admin/tariffs` | Manage tariffs |

---

## API Sync Status

This table shows which API endpoints are ready on each side.

**`✓`** = done · **`stub`** = returns fake data for now · **`—`** = not started yet

| Method | URL | Frontend | Backend | What it does |
|---|---|:---:|:---:|---|
| `POST` | `/api/auth/register` | ✓ | stub | Create new account |
| `POST` | `/api/auth/login` | ✓ | stub | Log in, get token |
| `POST` | `/api/auth/refresh` | ✓ | stub | Renew expired token |
| `GET` | `/api/health` | ✓ | ✓ | Check if server is alive |
| `GET` | `/api/health?full=true` | ✓ | ✓ | Deep check including database and Lambda |
| `GET` | `/api/stations` | ✓ | stub | Get all stations |
| `GET` | `/api/stations/:id` | ✓ | stub | Get one station with its ports |
| `POST` | `/api/sessions/start` | ✓ | stub | Start charging |
| `POST` | `/api/sessions/:id/stop` | ✓ | stub | Stop charging |
| `GET` | `/api/sessions/active` | ✓ | stub | Get the current user's active session |
| `GET` | `/api/sessions/history` | ✓ | stub | Get the current user's past sessions |
| `GET` | `/api/sessions/all` | ✓ | stub | Get all sessions (tech support / admin) |
| `GET` | `/api/tech-support/errors` | ✓ | stub | Get error logs |
| `PATCH` | `/api/tech-support/errors/:id/status` | ✓ | stub | Mark error as resolved |
| `PATCH` | `/api/tech-support/stations/:id/mode` | ✓ | stub | Change station mode |
| `GET` | `/api/tech-support/stats` | ✓ | stub | Get system stats |
| `GET` | `/api/admin/users` | ✓ | stub | Get all users |
| `PATCH` | `/api/admin/users/:id/role` | ✓ | stub | Change user role |
| `PATCH` | `/api/admin/users/:id/block` | ✓ | stub | Block or unblock a user |
| `DELETE` | `/api/admin/users/:id` | ✓ | stub | Delete a user |
| `POST` | `/api/admin/stations` | ✓ | stub | Create a new station |
| `PATCH` | `/api/admin/stations/:id/commission` | ✓ | stub | Put station into operation |
| `PATCH` | `/api/admin/stations/:id/tariff` | ✓ | stub | Update station price |

---

## Auth — How Tokens Are Stored

### Right now

After login, the server sends back an **access token** (a string that proves who you are).
We save it in `localStorage` — browser storage that any JavaScript on the page can read.

This is simple to implement but not fully secure: if someone manages to inject
malicious code into the page, they could steal the token.
It is fine for this stage of the project.

### Planned improvement (needs backend + frontend to do together)

Instead of giving the token to the frontend at all, the server will store the session
in a **secure cookie** that JavaScript cannot read. The browser sends it automatically
with every request — the frontend never touches it.

What needs to change on each side:

| Side | What to do |
|---|---|
| Backend | On login, set a secure cookie instead of returning the token in the response body |
| Backend | On all protected routes, read the cookie instead of the Authorization header |
| Backend | On logout, delete the cookie |
| Frontend | Remove the code that saves the token to localStorage |
| Frontend | Remove the code that adds the token to every request header |
| Frontend | Add `withCredentials: true` to the HTTP client config |

This will be done in one step by both teams together.

---

## Access Rules

What happens when a user tries to open a page they shouldn't:

| Situation | What happens |
|---|---|
| Not logged in | Redirected to `/login?redirect={page they tried to open}` |
| Logged in but wrong role | Redirected to `/error/forbidden` |
| Server says session expired (401) | Redirected to `/login?redirect={current page}` |
| Server says no permission (403) | Redirected to `/error/forbidden` |
| Server crashes (500+) | Redirected to `/error/system` |
| Already logged in, opens `/login` | Redirected to `/` |

These rules are enforced in two places:
- `ProtectedRoute` component in `App.tsx` — checks role before rendering a page
- HTTP client in `api/client.ts` — catches error responses from the server

---

## Page Layouts

Every page uses one of three layouts:

| Layout | What it looks like | Used by |
|---|---|---|
| Public | No navigation bar, centered card on plain background | `/login`, `/register` |
| Error | Dark full-screen background, no navigation bar | `/error/*`, `/*` |
| App | Sticky top navigation bar + page content | All logged-in pages |

---

## Pages

---

### `/login` — Login

**File:** `src/auth/Login.tsx`

**What the user sees:**
- Email and password fields
- "Sign In" button (grayed out while loading)
- Link to the registration page
- Error message if login fails
- Quick login hints in development mode

**After login:** user is taken to the page they originally tried to open, or to `/`

---

### `/register` — Sign Up

**File:** `src/auth/Register.tsx`

**What the user sees:**
- Name, email, password, and optional phone fields
- "Create Account" button
- Link back to login
- Validation errors under each field

**After registration:** user is taken to `/login`

---

### `/error/forbidden` — Access Denied

**File:** `src/pages/error/ErrorForbidden.tsx`

**What the user sees:**
- "403" and an icon
- Short message explaining they don't have access
- "Back to Home" button

**When it appears:** user tries to open a page their role doesn't allow

---

### `/error/system` — Server Error

**File:** `src/pages/error/ErrorSystem.tsx`

**What the user sees:**
- "500" and an icon
- Short message that something went wrong on the server
- "Go Back" and "Home" buttons

**When it appears:** the server returns a 500-level error

---

### `/*` — Not Found

**File:** `src/pages/error/NotFound.tsx`

**What the user sees:**
- "404" and an icon
- "Back to Home" button

**When it appears:** user opens a URL that doesn't exist

---

### `/` — Dashboard

**File:** `src/pages/Dashboard.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Greeting with their name
- Cards linking to main sections (more cards shown for tech support and admin)
- **Health Check** panel:
  - "Health Check" button — asks the server if it's alive
  - "Full Health Check" button — also checks the database and background services
  - Shows the server's response and when the check was last run

---

### `/stations` — Station List

**File:** `src/pages/user/StationList.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Search box (by name or address)
- Filter tabs: All / Active / Maintenance / Offline
- Cards for each station showing name, address, status, available ports, price
- Each card links to that station's detail page

**API:** `GET /api/stations`

---

### `/stations/:stationId` — Station Details

**File:** `src/pages/user/StationDetail.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Station name, address, status, and price
- List of charging ports with their status
- "Start Charging" button on available ports
- A small form to enter battery size and target charge level
- Back link to the station list

**API:** `GET /api/stations/:id`, `POST /api/sessions/start`  
**After starting:** user is taken to `/sessions/current`

---

### `/sessions/current` — Current Charging Session

**File:** `src/pages/user/ChargingSession.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Charging progress (percentage)
- Energy consumed so far (kWh)
- Current cost (₽)
- Time elapsed and estimated time remaining
- "Stop Charging" button (asks for confirmation first)
- If no session is active: message with a link to find a station

**The page refreshes automatically every 10 seconds.**

**API:** `GET /api/sessions/active`, `POST /api/sessions/:id/stop`

---

### `/sessions/history` — Charging History

**File:** `src/pages/user/SessionHistory.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Date range and status filters
- List of past sessions (newest first) with station, energy, cost, duration, and status
- Total summary at the bottom

**API:** `GET /api/sessions/history`

---

### `/account/profile` — My Profile

**File:** `src/pages/account/Profile.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Their avatar (initials), email, and role
- Account details
- "Sign Out" button

---

### `/account/settings` — Settings

**File:** `src/pages/account/Settings.tsx`  
**Who can see it:** everyone logged in

**What the user sees:**
- Toggle for email notifications
- Toggle for session reminders
- Toggle for cost alerts

---

### `/support/dashboard` — Operations Overview

**File:** `src/pages/support/SupportDashboard.tsx`  
**Who can see it:** TECH_SUPPORT, ADMIN

**What the user sees:**
- Three counters: active sessions, total stations, unresolved errors
- Quick links to logs, station controls, and active sessions

**API:** `GET /api/tech-support/stats`

---

### `/support/logs` — Error Logs

**File:** `src/pages/techSupport/ErrorLog.tsx`  
**Who can see it:** TECH_SUPPORT, ADMIN

**What the user sees:**
- Filters by level, service, status, and date range
- List of errors with timestamp, severity, service name, and message
- "Resolve" button per error

**API:** `GET /api/tech-support/errors`, `PATCH /api/tech-support/errors/:id/status`

---

### `/support/stations` — Station Controls

**File:** `src/pages/techSupport/StationManagement.tsx`  
**Who can see it:** TECH_SUPPORT, ADMIN

**What the user sees:**
- List of all stations with their current status
- Dropdown per station to switch mode: Active / Maintenance / Offline
- Confirmation before changing mode

**API:** `GET /api/stations`, `PATCH /api/tech-support/stations/:id/mode`

---

### `/support/sessions` — Active Sessions

**File:** `src/pages/support/SupportSessions.tsx`  
**Who can see it:** TECH_SUPPORT, ADMIN

**What the user sees:**
- List of all currently active sessions across all users
- For each: session ID, station, port, energy, cost, status
- "Force Stop" button (asks for confirmation first)
- Refreshes automatically every 30 seconds

**API:** `GET /api/sessions/all?status=ACTIVE`, `POST /api/sessions/:id/stop`

---

### `/admin/dashboard` — Admin Home

**File:** `src/pages/admin/AdminDashboard.tsx`  
**Who can see it:** ADMIN only

**What the user sees:**
- Navigation cards to all admin sections: users, stations, tariffs, operations

---

### `/admin/users` — Manage Users

**File:** `src/pages/admin/UserManagement.tsx`  
**Who can see it:** ADMIN only

**What the user sees:**
- Filters by role and blocked status
- Table of users with email, role, and blocked status
- Dropdown to change a user's role
- Toggle to block or unblock
- Delete button (asks for confirmation)

**API:** `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`, `PATCH /api/admin/users/:id/block`, `DELETE /api/admin/users/:id`

---

### `/admin/stations` — Manage Stations

**File:** `src/pages/admin/StationAdmin.tsx`  
**Who can see it:** ADMIN only

**What the user sees:**
- List of all stations
- "Create Station" button with a form (name, address, ports, power, price)
- "Commission" button to activate a newly created station
- Inline price edit per station

**API:** `GET /api/stations`, `POST /api/admin/stations`, `PATCH /api/admin/stations/:id/commission`, `PATCH /api/admin/stations/:id/tariff`

---

### `/admin/tariffs` — Manage Tariffs

**File:** `src/pages/admin/TariffManagement.tsx`  
**Who can see it:** ADMIN only

**What the user sees:**
- List of stations with their current price (₽/kWh) and when it was last updated
- Inline edit field + Save button per station

**API:** `GET /api/stations`, `PATCH /api/admin/stations/:id/tariff`

---

## URL Filters

Some pages support filters passed in the URL (e.g. `/stations?status=ACTIVE`).
This lets users bookmark filtered views and share links.

| Page | Param | Example values |
|---|---|---|
| `/stations` | `search` | any text |
| `/stations` | `status` | `ACTIVE`, `MAINTENANCE`, `OFFLINE` |
| `/sessions/history` | `from` | `2025-01-01` |
| `/sessions/history` | `to` | `2025-12-31` |
| `/sessions/history` | `status` | `COMPLETED`, `STOPPED`, `ERROR` |
| `/support/logs` | `level` | `ERROR`, `WARN`, `INFO` |
| `/support/logs` | `service` | service name |
| `/support/logs` | `status` | `open`, `resolved` |
| `/support/logs` | `from` / `to` | date range |
| `/admin/users` | `role` | `USER`, `TECH_SUPPORT`, `ADMIN` |
| `/admin/users` | `blocked` | `true`, `false` |
| `/login` | `redirect` | the page to go back to after login |

---

## Browser Tab Titles

Pattern: `{Page Name} — EV Charge`

| Page | Title |
|---|---|
| `/login` | `Sign In — EV Charge` |
| `/register` | `Sign Up — EV Charge` |
| `/` | `Dashboard — EV Charge` |
| `/stations` | `Stations — EV Charge` |
| `/stations/:id` | `{Station Name} — EV Charge` |
| `/sessions/current` | `Charging in Progress — EV Charge` |
| `/sessions/history` | `Session History — EV Charge` |
| `/account/profile` | `Profile — EV Charge` |
| `/account/settings` | `Settings — EV Charge` |
| `/support/dashboard` | `Operations Dashboard — EV Charge` |
| `/support/logs` | `Error Logs — EV Charge` |
| `/support/stations` | `Station Management — EV Charge` |
| `/support/sessions` | `Active Sessions — EV Charge` |
| `/admin/dashboard` | `Admin Dashboard — EV Charge` |
| `/admin/users` | `User Management — EV Charge` |
| `/admin/stations` | `Stations Management — EV Charge` |
| `/admin/tariffs` | `Tariffs Management — EV Charge` |
| `/error/forbidden` | `Access Denied — EV Charge` |
| `/error/system` | `Server Error — EV Charge` |
| `/*` | `Not Found — EV Charge` |

---

## Filter Persistence

When a user goes back to a page, their filters are still there because they are stored in the URL.

| Page | What is saved |
|---|---|
| `/stations` | Search text and status filter |
| `/sessions/history` | Date range and status filter |
| `/support/logs` | All filters |
| `/admin/users` | Role and blocked filters |

---

## Dangerous Actions

These actions cannot be undone. The user must confirm before they happen.

| Action | Page | Confirmation message |
|---|---|---|
| Stop charging | `/sessions/current` | "Stop the current session?" |
| Force stop a session | `/support/sessions` | "Force stop this session?" |
| Set station to Maintenance | `/support/stations` | "Set station to Maintenance? Active sessions may be interrupted." |
| Delete a user | `/admin/users` | "Delete user {email}? This cannot be undone." |
| Block a user | `/admin/users` | "Block user {email}?" |
| Commission a station | `/admin/stations` | "Put this station into operation?" |
