# Responsive Layout Diagrams

Diagrams showing how each basic page renders at desktop (≥1024px), tablet (768–1023px), and mobile (<768px).

## Add to Miro Whiteboard

1. Open `responsive-layouts.html` in a browser (double-click or `open responsive-layouts.html`)
2. For each diagram section, take a screenshot (Cmd+Shift+4 on macOS, Win+Shift+S on Windows)
3. In Miro: **Upload** (or +) → **Image** → paste or drag the screenshot
4. Or: right-click diagram area → **Copy image** → paste into Miro (Ctrl/Cmd+V)

**Suggested Miro board structure:**
- Create frames: "Login", "Dashboard", "Station List", "Station Detail", "Charging Session", "Session History", "Support", "Admin"
- Place desktop / tablet / mobile variants side by side within each frame

## Pages Covered

| Page | Route | Breakpoints |
|------|-------|-------------|
| Guest Page | `/` | Desktop, Tablet, Mobile |
| Login / Register | `/login`, `/register` | Desktop, Tablet, Mobile |
| Dashboard | `/` | Desktop, Tablet, Mobile |
| Station List | `/stations` | Desktop, Tablet, Mobile |
| Station Detail | `/stations/:id` | Desktop, Tablet, Mobile |
| Charging Session | `/sessions/current` | Desktop+Tablet, Mobile |
| Session History | `/sessions/history` | Desktop, Tablet, Mobile |
| Support Dashboard | `/support/dashboard` | Desktop, Tablet, Mobile |
| Error Logs | `/support/logs` | Desktop, Tablet, Mobile |
| Admin Dashboard | `/admin/dashboard` | Desktop, Tablet, Mobile |
