# App Skeleton — Main Pages for Miro Whiteboard

## Roles and Main Pages

| Role | Main Page | Route | Access |
|------|-----------|-------|--------|
| **GUEST** | Guest Landing | `/` | Unauthenticated |
| **CLIENT** (USER) | Client Dashboard | `/` | Authenticated, role USER |
| **SUPPORT** (TECH_SUPPORT) | Support Dashboard | `/support/dashboard` | Authenticated, role TECH_SUPPORT or ADMIN |
| **ADMIN** | Admin Dashboard | `/admin/dashboard` | Authenticated, role ADMIN |

## Miro Board Structure

### 1. Main Pages (4 frames)

Create 4 frames in Miro, one per role:

- **Frame: Guest** — Guest landing: station list stub, HealthCheck, Sign In / Register
- **Frame: Client** — Client dashboard: Stations, Charging, History cards, System Health
- **Frame: Support** — Support dashboard: KPI cards (Active Sessions, Total Stations, Errors), quick links
- **Frame: Admin** — Admin dashboard: Users, Stations, Tariffs links

### 2. Schemas (Desktop / Tablet / Mobile)

All page schemas are in `docs/responsive-diagrams/responsive-layouts.html`.

**To add to Miro:**
1. Open `responsive-layouts.html` in a browser
2. Screenshot each diagram section
3. Upload to Miro: **Upload** → **Image** → paste or drag

**Pages with schemas:**
- Login / Register
- Dashboard (Client)
- Guest (add from HTML or use Station List as proxy)
- Station List
- Station Detail
- Charging Session
- Session History
- Support Dashboard
- Error Logs
- Admin Dashboard

### 3. React App Structure

```
frontend/src/
├── index.tsx              — entry, providers
├── App.tsx                — routes
├── auth/                  — Login, Register, ProtectedRoute, AuthContext
├── app/hooks/             — useAppDispatch, useAppSelector, useAppStore
├── store/                 — Redux store, slices
├── api/                   — Axios client
├── components/            — Layout, Navbar, StatusBadge, etc.
├── pages/
│   ├── GuestPage.tsx      — GUEST main page (/)
│   ├── Dashboard.tsx      — CLIENT main page (/ when auth)
│   ├── user/              — StationList, StationDetail, ChargingSession, SessionHistory
│   ├── support/           — SupportDashboard, SupportSessions
│   ├── admin/             — AdminDashboard, UserManagement, StationAdmin, TariffManagement
│   ├── techSupport/       — ErrorLog, StationManagement
│   ├── account/           — Profile, Settings
│   └── error/             — NotFound, ErrorForbidden, ErrorSystem
├── hooks/                 — useAuth, usePolling
├── i18n/                  — translations
├── types/                 — TypeScript interfaces
└── utils/                 — constants, error helpers
```

### 4. Routing Summary

| Path | Page | Role |
|------|------|------|
| `/` | GuestPage or Dashboard | Guest or any authenticated |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/stations` | Station List | Public |
| `/stations/:id` | Station Detail | Public |
| `/sessions/current` | Charging Session | USER+ |
| `/sessions/history` | Session History | USER+ |
| `/support/dashboard` | Support Dashboard | TECH_SUPPORT, ADMIN |
| `/support/logs` | Error Logs | TECH_SUPPORT, ADMIN |
| `/support/stations` | Station Management | TECH_SUPPORT, ADMIN |
| `/support/sessions` | Active Sessions | TECH_SUPPORT, ADMIN |
| `/admin/dashboard` | Admin Dashboard | ADMIN |
| `/admin/users` | User Management | ADMIN |
| `/admin/stations` | Station Admin | ADMIN |
| `/admin/tariffs` | Tariff Management | ADMIN |
