# Frontend Documentation

## Backend-Frontend API Documentation

The potential backend-frontend interaction (API endpoints, request/response schemas, and data models) is described in the [specification.yaml](../specification.yaml) file at the project root. This OpenAPI 3.0 specification defines the EV Charging Public API contract.

### Previewing the API Specification

To preview the `specification.yaml` file in OpenAPI (Swagger) format within VS Code, you can use the **Swagger Viewer** extension:

1. Install the [Swagger Viewer](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer) extension from the VS Code Marketplace.
2. Open `specification.yaml` in the editor.
3. Open the preview using any of these methods:
   - **Command Palette**: Run `Preview Swagger` (Ctrl+Shift+P or Cmd+Shift+P, then type "Preview Swagger")
   - **Keyboard shortcut**: `Shift + Alt + P`
   - **Context menu**: Right-click the file in the Explorer and select "Preview Swagger"

The extension supports both YAML and JSON formats and provides a formatted, interactive view of the API documentation.

---

## Run Frontend Locally

### Prerequisites

- Install [Node.js](https://nodejs.org/) (LTS recommended, includes `npm`).
- Make sure the backend service is running and reachable from your machine.

### Install Dependencies

From the `frontend` directory:

```bash
npm install
```

### Configure Environment

Create a local env file in `frontend` (for example: `.env.local`) and define:

```bash
VITE_LOG_LEVEL=debug
VITE_API_BASE_URL=http://localhost:3000
VITE_API_URL_PREFIX=/api/v1
VITE_API_TIMEOUT=3000
```

Notes:

- These values are consumed through `src/config/env.ts` (`config` object).
- `VITE_API_BASE_URL` should point to your backend host.
- `VITE_API_URL_PREFIX` should match backend API routing.
- `VITE_API_TIMEOUT` is in milliseconds.

### Start Development Server

From the `frontend` directory:

```bash
npm run dev
```

Vite prints the local URL in terminal (commonly `http://localhost:5173`).

### Build and Preview Production Bundle

```bash
npm run build
npm run preview
```

Use `npm run lint` to run ESLint checks.

## Environment Variables and Config

Environment variables are accessed through a single config module: `src/config/env.ts`.

- Contributors should read values from `config` instead of using `import.meta.env` directly in feature code.
- This gives one centralized place for environment-backed settings.

Current variables in `config`:

- `VITE_LOG_LEVEL` -> `config.logLevel`
  - Logging threshold for the app logger (`debug`, `info`, `warn`, `error`).
  - Used by `src/services/logging/logger.ts`.

- `VITE_API_BASE_URL` -> `config.apiBaseUrl`
  - Base backend URL (for example: `http://localhost:3000`).
  - Used to build API requests in `src/services/api/api.ts`.

- `VITE_API_URL_PREFIX` -> `config.apiPrefix`
  - Common API path prefix appended to base URL (for example: `/api/v1`).
  - Combined with base URL in the API client.

- `VITE_API_TIMEOUT` -> `config.apiTimeout`
  - Request timeout for API calls in milliseconds.
  - If not provided, API client falls back to `3000`.

## Logging Service

Logging is implemented in `src/services/logging/logger.ts` and exported from `src/services/logging/index.ts` as `getLogger`.

How contributors should use it:

- Import logger factory from the service barrel:
  - `import { getLogger } from '@/services/logging'`
- Use default app logger:
  - `const logger = getLogger()`
- Or create/reuse a named logger per feature:
  - `const logger = getLogger('ApiClient')`

Implementation highlights:

- Uses level filtering with priorities: `debug < info < warn < error`.
- Reads active level from `config.logLevel`, validates it, and falls back to `info`.
- Formats output as `[loggerName] [LEVEL] message`.
- Maintains a map of logger instances so named loggers are reused.
- Routes to browser console handlers (`console.log`, `console.warn`, `console.error`).

## API Client Service

API communication is implemented in `src/services/api/api.ts` and exported from `src/services/api/index.ts` as `apiClient`.

Underlying technology:

- Built on [Axios](https://axios-http.com/).
- Creates a shared Axios instance (`axios.create`) with:
  - `baseURL = ${config.apiBaseUrl}${config.apiPrefix}`
  - JSON `Content-Type`
  - timeout from `config.apiTimeout` (fallback: `3000`)

Interceptors:

- A response interceptor centralizes error handling.
- It maps backend/transport errors to app-level errors:
  - `401` -> `UnauthorizedError`
  - `403` -> `ForbiddenError`
  - Other HTTP errors -> `HttpError(message, code, status)`
  - Network/configuration failures -> `HttpError(..., NETWORK_ERROR | CONFIG_ERROR)`
- It also logs structured debug details through the logging service.

How to make API calls:

- Use `apiClient.get<T>(endpoint, queryParams?)` for GET requests.
- Use `apiClient.post<T>(endpoint, body?, axiosConfig?)` for POST requests.
- Always provide a response type `T` for type-safe data handling.

Examples in current code:

- `src/hooks/useFetchData.ts` uses `apiClient.get<T>(endpoint, params)` for generic fetch hooks.
- `src/components/HealthChecker.tsx` uses `apiClient.get<HealthResponse>(...)` for health checks.

## Frontend Routing Model

Routing is implemented with React Router in Data Mode.

- Route definitions live in `src/router/router.tsx` via `createBrowserRouter(...)`.
- The router is mounted in `src/main.tsx` with `<RouterProvider router={router} />`.
- Data Mode docs: [React Router - Data Routing](https://reactrouter.com/start/data/routing).

### Route Guards

- `src/router/ProtectedRoute.tsx`
  - Used for `/user/*` routes.
  - Current implementation is a **mock** (`isAuthenticated = true`).
  - On failed auth it redirects to `/login`; otherwise it renders `<Outlet />`.

- `src/router/RoleRoute.tsx`
  - Used for role-scoped sections like `/support/*` and `/admin/*`.
  - Current implementation is also a **mock placeholder**.
  - The guard currently allows access because `userRole` is set from the incoming `role` prop.
  - Keep this in mind when extending authorization behavior.

### Current Pages (Blank Placeholders)

#### Guest

- `/` -> `src/pages/guest/GuestDashboardPage.tsx`
- `/login` -> `src/pages/guest/LoginPage.tsx`
- `/register` -> `src/pages/guest/RegisterPage.tsx`

#### User (Protected)

- `/user` -> `src/pages/user/UserDashboardPage.tsx`
- `/user/session` -> `src/pages/user/UserCurrentSessionPage.tsx`
- `/user/account/profile` -> `src/pages/user/UserProfilePage.tsx`

#### Support (Role: `support`)

- `/support` -> `src/pages/support/SupportDashboardPage.tsx`
- `/support/logs` -> `src/pages/support/SupportLogsPage.tsx`
- `/support/stations` -> `src/pages/support/SupportStationsPage.tsx`
- `/support/sessions` -> `src/pages/support/SupportSessionsPage.tsx`

#### Admin (Role: `admin`)

- `/admin` -> `src/pages/admin/AdminDashboardPage.tsx`
- `/admin/users` -> `src/pages/admin/AdminUsersPage.tsx`
- `/admin/stations` -> `src/pages/admin/AdminStationsPage.tsx`

### Frontend Health Checks

Health checks are exposed on the guest landing page in `src/pages/guest/GuestDashboardPage.tsx` via the `HealthChecker` component.

- **Shallow check** (`endpoint='/health'`)
  - Validates reachability of the Node.js backend service only.
  - In UI this is shown as "Check backend service".

- **Deep check** (`endpoint='/health/api'`)
  - Validates a broader path through the backend and AWS infrastructure (backend + Lambda integration).
  - In UI this is shown as "Check backend + lambda".
