# Frontend — React SPA (Easy Charge)

A TypeScript single-page application for managing electric vehicle charging stations. Built with React 19, Vite 7, Redux Toolkit, Tailwind CSS, and a structured logging/config layer aligned with the team repository.

---

## Technology Stack

| Tool | Version | Purpose |
|---|---|---|
| **React** | 19 | UI library, component-based SPA |
| **TypeScript** | 5.9 | Static typing, safer refactoring |
| **Vite** | 7 | Build tool and dev server (ESM-native) |
| **@vitejs/plugin-react-swc** | 4 | SWC compiler — 20× faster than Babel HMR |
| **React Router** | v6 | Client-side routing with protected routes |
| **Redux Toolkit** | 2 | Global state management |
| **Axios** | 1.13 | HTTP client with JWT/401 interceptors |
| **Tailwind CSS** | 3.4 | Utility-first CSS, mobile-first responsive design |

---

## Project Structure

```
frontend/
├── env.example                       — required environment variables
├── vite.config.ts                    — Vite config: SWC plugin, @ alias, dev proxy
├── tsconfig.json                     — TypeScript project references
├── tsconfig.app.json                 — strict TS config for browser code
├── tsconfig.node.json                — TS config for vite.config.ts
├── eslint.config.js                  — ESLint with TypeScript + React Hooks rules
├── tailwind.config.js                — custom color palette (primary/accent)
├── index.html                        — app shell, title: "Easy Charge"
└── src/
    ├── index.tsx                     — entry point: Provider → Router → AuthProvider → App
    ├── App.tsx                       — route definitions with ProtectedRoute wrappers
    ├── index.css                     — Tailwind base + global resets
    │
    ├── services/                     — cross-cutting infrastructure
    │   ├── config/
    │   │   └── env.ts                — centralised VITE_ env vars (apiBaseUrl, logLevel)
    │   └── logging/
    │       └── logger.ts             — Logger class: levels, named loggers, LOGGER_MAP
    │
    ├── types/
    │   └── index.ts                  — domain interfaces: Station, Port, Session, User,
    │                                    ErrorLog, HealthResponse, StartChargingParams
    │
    ├── api/
    │   └── client.ts                 — Axios instance (baseURL from config), request/
    │                                    response interceptors, 5 API groups
    │
    ├── auth/
    │   ├── AuthContext.tsx           — React Context: login, logout, register, role flags
    │   ├── Login.tsx                 — login form page
    │   ├── Register.tsx              — registration form page
    │   └── ProtectedRoute.tsx        — redirects unauthenticated / wrong-role users
    │
    ├── store/
    │   ├── index.ts                  — configureStore, RootState, AppDispatch exports
    │   └── slices/
    │       ├── authSlice.ts          — user state, loginUser / registerUser thunks
    │       ├── stationsSlice.ts      — stations list + detail, fetchStations thunk
    │       ├── sessionsSlice.ts      — active session + history, start/stop thunks
    │       ├── healthSlice.ts        — health check response + lastChecked timestamp
    │       ├── adminSlice.ts         — users list, fetchUsers thunk
    │       └── techSupportSlice.ts   — error logs + system stats thunks
    │
    ├── hooks/
    │   ├── useAuth.ts                — wrapper around AuthContext with null guard
    │   └── usePolling.ts             — setInterval hook using useRef to avoid stale closures
    │
    ├── utils/
    │   ├── constants.ts              — status arrays (as const), union types, STATUS_COLORS map
    │   └── error.ts                  — getErrorMessage(err, fallback): axios.isAxiosError guard
    │
    ├── components/
    │   ├── Layout.tsx                — page shell with sticky Navbar + main content area
    │   ├── Navbar.tsx                — desktop nav + hamburger mobile menu, role-aware links
    │   └── common/
    │       ├── StatusBadge.tsx       — coloured pill badge mapped from STATUS_COLORS
    │       └── LoadingSpinner.tsx    — animated spinner (sm / md / lg sizes)
    │
    └── pages/
        ├── Dashboard.tsx             — home page: quick-nav cards + Health Check widget
        ├── user/
        │   ├── StationList.tsx       — filterable station grid
        │   ├── StationDetail.tsx     — station info + port grid + start charging
        │   ├── ChargingSession.tsx   — live SVG progress ring, polling every 3 s
        │   └── SessionHistory.tsx    — completed sessions table
        ├── techSupport/
        │   ├── ErrorLog.tsx          — error log with level/status/service filters
        │   ├── StationManagement.tsx — set station mode + force-stop sessions
        │   └── SystemStats.tsx       — stats dashboard, polling every 10 s
        └── admin/
            ├── UserManagement.tsx    — role change, block/unblock, delete users
            ├── StationAdmin.tsx      — create station form + commission button
            └── TariffManagement.tsx  — inline tariff editor per station
```

---

## Environment Variables

Copy `env.example` to `.env` before running:

```bash
cp env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Backend base URL. In dev the Vite proxy rewrites `/api/*` → `localhost:3001`. In production set to the full backend URL. |
| `VITE_API_PREFIX` | `/api` | URL prefix (informational) |
| `VITE_LOG_LEVEL` | `info` | Client-side log level: `debug` / `info` / `warn` / `error` |

> **Note:** only variables prefixed with `VITE_` are exposed to the browser bundle. Never put secrets in these variables.

---

## Architecture

### Provider Stack (`index.tsx`)

```
<Redux Provider store={store}>
  <BrowserRouter>
    <AuthProvider>          ← React Context for auth state
      <App />               ← route tree
    </AuthProvider>
  </BrowserRouter>
</Redux Provider>
```

### Services Layer

**`services/config/env.ts`** — single source of truth for all env vars:
```typescript
export const config = {
  logLevel: import.meta.env.VITE_LOG_LEVEL,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
}
```

**`services/logging/logger.ts`** — named Logger instances with numeric level filtering:
```typescript
const logger = getLogger('ChargingSession')
logger.info('Session polling started')
// Output: [ChargingSession] [INFO] Session polling started
```
Log level is controlled at runtime via `VITE_LOG_LEVEL`. Setting `warn` silences all `debug` and `info` calls without code changes.

### State Management

Redux store shape:
```typescript
{
  auth:        { user: User | null, loading, error }
  stations:    { list: Station[], currentStation, loading, error }
  sessions:    { activeSession: Session | null, history: Session[], loading, error }
  health:      { response: HealthResponse | null, loading, error, lastChecked }
  admin:       { users: User[], loading, error }
  techSupport: { errors: ErrorLog[], stats, loading, error }
}
```

All async operations use `createAsyncThunk`. Errors are extracted via `getErrorMessage(err, fallback)` from `utils/error.ts`, which uses `axios.isAxiosError()` for type-safe error unwrapping — no `any` casts.

### HTTP Client (`api/client.ts`)

Axios instance reads `baseURL` from `config.apiBaseUrl`.

**Request interceptor** — attaches `Authorization: Bearer <token>` from `localStorage` to every request.

**Response interceptor** — on `401`: clears stored tokens and redirects to `/login`.

Five API groups mirror the backend routes:

```typescript
authAPI        → /auth/*
stationsAPI    → /stations/*
sessionsAPI    → /sessions/*
adminAPI       → /admin/*
techSupportAPI → /tech-support/*
```

### Routing & Access Control

`ProtectedRoute` wraps every authenticated route. It checks `isAuthenticated` and optionally a `roles` array:

```tsx
// accessible to all authenticated users
<Route path="/stations" element={<ProtectedRoute><Layout><StationList /></Layout></ProtectedRoute>} />

// TECH_SUPPORT and ADMIN only
<Route path="/tech/errors" element={<ProtectedRoute roles={['TECH_SUPPORT','ADMIN']}>...</ProtectedRoute>} />

// ADMIN only
<Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}>...</ProtectedRoute>} />
```

---

## Pages & Role Visibility

| Path | Page | USER | TECH_SUPPORT | ADMIN |
|---|---|:---:|:---:|:---:|
| `/` | Dashboard + Health Check | ✓ | ✓ | ✓ |
| `/stations` | Station list | ✓ | ✓ | ✓ |
| `/stations/:id` | Station detail + start charging | ✓ | ✓ | ✓ |
| `/charging` | Active charging session | ✓ | ✓ | ✓ |
| `/history` | Session history | ✓ | ✓ | ✓ |
| `/tech/errors` | Error log | — | ✓ | ✓ |
| `/tech/manage` | Station mode management | — | ✓ | ✓ |
| `/tech/stats` | System statistics | — | ✓ | ✓ |
| `/admin/users` | User management | — | — | ✓ |
| `/admin/stations` | Create & commission stations | — | — | ✓ |
| `/admin/tariffs` | Tariff editor | — | — | ✓ |
| `/login` | Sign in | public | public | public |
| `/register` | Sign up | public | public | public |

---

## Responsive Design

Tailwind CSS mobile-first breakpoints:

| Breakpoint | Width | Device | Layout |
|---|---|---|---|
| (default) | < 640 px | Mobile | 1-column grid, hamburger menu |
| `sm:` | ≥ 640 px | Large phone | Row buttons, sm: variants |
| `md:` | ≥ 768 px | Tablet | 2-column grid, horizontal nav |
| `lg:` | ≥ 1024 px | Desktop | 3-column grid, full navbar, role badges visible |

Key responsive patterns:
- Navbar: `hidden lg:flex` for desktop links, `lg:hidden` for hamburger toggle
- Dashboard cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Health Check buttons: `flex-col sm:flex-row`
- Station form: `grid-cols-1 md:grid-cols-2`

---

## API Contracts

### All authenticated roles

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Gateway health check |
| `GET` | `/health?full=true` | Full chain: Gateway → Lambda → DynamoDB |

### USER

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password, name, phoneNumber? }` | Register |
| `POST` | `/api/auth/login` | `{ email, password }` | Login, returns JWT |
| `GET` | `/api/stations` | — | List all stations |
| `GET` | `/api/stations/:id` | — | Station details + ports |
| `POST` | `/api/sessions/start` | `{ stationId, portId, batteryCapacityKwh, targetChargePercent }` | Start charging |
| `POST` | `/api/sessions/:id/stop` | — | Stop own session |
| `GET` | `/api/sessions/active` | — | Current active session (polled every 3 s) |
| `GET` | `/api/sessions/history` | — | Completed sessions |

### TECH_SUPPORT (and ADMIN)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/tech-support/errors` | `?level=&status=&service=` | Error log with filters |
| `PATCH` | `/api/tech-support/errors/:id/status` | `{ status, timestamp? }` | Update error status |
| `PATCH` | `/api/tech-support/stations/:id/mode` | `{ status }` | Set station mode |
| `POST` | `/api/tech-support/sessions/:id/force-stop` | — | Force stop a session |
| `GET` | `/api/tech-support/stats` | — | System stats (polled every 10 s) |

### ADMIN

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | — | All users |
| `PATCH` | `/api/admin/users/:id/role` | `{ role }` | Change user role |
| `PATCH` | `/api/admin/users/:id/block` | `{ blocked }` | Block / unblock user |
| `DELETE` | `/api/admin/users/:id` | — | Delete user |
| `POST` | `/api/admin/stations` | `{ name, address, lat, lon, portCount, powerKw, tariffPerKwh }` | Create station |
| `PATCH` | `/api/admin/stations/:id/commission` | — | Commission station (NEW → ACTIVE) |
| `PATCH` | `/api/admin/stations/:id/tariff` | `{ tariffPerKwh }` | Update tariff |

---

## Running the App

```bash
# install dependencies
npm install

# development server → http://localhost:5173
npm run dev

# type-check only (no emit)
npx tsc --noEmit

# production build → dist/
npm run build

# preview production build
npm run preview
```

---

## Dev Mode — Quick Logins

Without AWS Cognito configured, the backend accepts any password for test accounts:

| Email | Role |
|---|---|
| `user@test.com` | USER |
| `tech@test.com` | TECH_SUPPORT |
| `admin@test.com` | ADMIN |

---

## Key Design Decisions

### Why TypeScript?
The frontend communicates with a typed backend API. TypeScript enforces the contract between frontend and backend at compile time — if the backend changes a field name, the compiler immediately highlights every affected location. All domain models live in `src/types/index.ts` as a single source of truth.

### Why `getErrorMessage` utility?
Axios errors have a nested structure (`err.response.data.message`). Without a shared helper, every `catch` block either used unsafe `err: any` or a verbose type cast. The utility uses `axios.isAxiosError()` — the official type guard — to safely narrow `unknown` to `AxiosError`, keeping all catch blocks to a single readable line.

### Why `useRef` in `usePolling`?
If `callback` were placed directly in the `setInterval` effect's dependency array, every re-render that creates a new function reference would restart the interval. `useRef` stores the latest callback without triggering effect re-runs — the interval is stable while the callback is always fresh.

### Why Vite + SWC over CRA + Babel?
SWC (written in Rust) compiles TypeScript/JSX approximately 20× faster than Babel. Combined with Vite's native-ESM dev server (no full bundle on startup), the HMR round-trip is under 100 ms versus 1–2 s with the traditional Webpack/Babel stack.
