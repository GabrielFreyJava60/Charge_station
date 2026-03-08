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