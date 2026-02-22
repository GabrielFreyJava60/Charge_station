# Frontend — React SPA

## Технологии

- **React 18** + **React Router v6** — SPA с клиентским роутингом
- **Redux Toolkit** — централизованное управление состоянием
- **Tailwind CSS** — утилитарный CSS фреймворк
- **Vite** — бандлер и dev-сервер
- **Axios** — HTTP-клиент с JWT-интерсептором

## Архитектура

```
src/
├── api/
│   └── client.js           — Axios instance + JWT interceptor + API functions
├── auth/
│   ├── AuthContext.jsx      — React Context для авторизации
│   ├── Login.jsx            — Страница входа
│   ├── Register.jsx         — Страница регистрации
│   └── ProtectedRoute.jsx   — HOC для защиты маршрутов по ролям
├── store/
│   ├── index.js             — Redux store конфигурация
│   └── slices/
│       ├── authSlice.js     — Состояние авторизации
│       ├── stationsSlice.js — Список станций
│       ├── sessionsSlice.js — Сессии зарядки
│       ├── healthSlice.js   — Health Check
│       ├── adminSlice.js    — Управление пользователями
│       └── techSupportSlice.js — Ошибки и статистика
├── components/
│   ├── Layout.jsx           — Общий layout с Navbar
│   ├── Navbar.jsx           — Навигация (desktop + мобильное меню)
│   └── common/
│       ├── StatusBadge.jsx  — Индикатор статуса
│       └── LoadingSpinner.jsx — Спиннер загрузки
├── pages/
│   ├── Dashboard.jsx        — Главная с Health Check
│   ├── user/
│   │   ├── StationList.jsx  — Список станций
│   │   ├── StationDetail.jsx — Детали + запуск зарядки
│   │   ├── ChargingSession.jsx — Активная сессия (polling)
│   │   └── SessionHistory.jsx — История сессий
│   ├── techSupport/
│   │   ├── ErrorLog.jsx     — Лог ошибок с фильтрами
│   │   ├── StationManagement.jsx — Управление режимами станций
│   │   └── SystemStats.jsx  — Статистика системы
│   └── admin/
│       ├── UserManagement.jsx — CRUD пользователей
│       ├── StationAdmin.jsx — Создание/ввод в эксплуатацию
│       └── TariffManagement.jsx — Редактор тарифов
├── hooks/
│   ├── useAuth.js           — Хук для AuthContext
│   └── usePolling.js        — Хук для периодических запросов
└── utils/
    └── constants.js         — Статусы, роли, цвета
```

## Страницы и видимость по ролям

| Путь | Страница | USER | TECH_SUPPORT | ADMIN |
|---|---|---|---|---|
| `/` | Dashboard + Health Check | yes | yes | yes |
| `/stations` | Список станций | yes | yes | yes |
| `/stations/:id` | Детали станции + зарядка | yes | yes | yes |
| `/charging` | Активная сессия зарядки | yes | yes | yes |
| `/history` | История сессий | yes | yes | yes |
| `/tech/errors` | Лог ошибок | — | yes | yes |
| `/tech/manage` | Управление станциями | — | yes | yes |
| `/tech/stats` | Статистика системы | — | yes | yes |
| `/admin/users` | Управление пользователями | — | — | yes |
| `/admin/stations` | Создание станций | — | — | yes |
| `/admin/tariffs` | Управление тарифами | — | — | yes |
| `/login` | Вход | public | public | public |
| `/register` | Регистрация | public | public | public |

## Адаптивный дизайн

Приложение адаптировано для трёх типов устройств:

### Desktop (lg: >= 1024px)
- Полная горизонтальная навигация
- Сетка карточек 3 столбца
- Таблицы в полную ширину

### Планшет (md: 768px — 1023px)
- Навигация по-прежнему горизонтальная (сокращённая)
- Сетка карточек 2 столбца
- Таблицы с горизонтальным скроллом

### Мобильные (sm: < 768px)
- Hamburger-меню (выдвижная панель)
- Карточки в 1 столбец
- Данные пользователя в выдвижном меню
- Кнопки на полную ширину

## Список запросов по ролям

### USER
1. `POST /api/auth/register` — регистрация
2. `POST /api/auth/login` — вход
3. `GET /api/stations` — список станций
4. `GET /api/stations/:id` — детали станции
5. `POST /api/sessions/start` — запуск зарядки
6. `POST /api/sessions/:id/stop` — остановка зарядки
7. `GET /api/sessions/active` — текущая сессия (polling 3s)
8. `GET /api/sessions/history` — история

### TECH_SUPPORT
9. `GET /api/tech-support/errors` — лог ошибок
10. `PATCH /api/tech-support/errors/:id/status` — смена статуса ошибки
11. `PATCH /api/tech-support/stations/:id/mode` — смена режима станции
12. `POST /api/tech-support/sessions/:id/force-stop` — принудительная остановка
13. `GET /api/tech-support/stats` — статистика (polling 10s)

### ADMIN
14. `GET /api/admin/users` — список пользователей
15. `PATCH /api/admin/users/:id/role` — смена роли
16. `PATCH /api/admin/users/:id/block` — блокировка
17. `DELETE /api/admin/users/:id` — удаление
18. `POST /api/admin/stations` — создание станции
19. `PATCH /api/admin/stations/:id/commission` — ввод в эксплуатацию
20. `PATCH /api/admin/stations/:id/tariff` — изменение тарифа

### Все роли
21. `GET /health` — проверка Gateway
22. `GET /health?full=true` — полная проверка цепочки

## Запуск

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build → dist/
```

## Dev Mode

В dev-режиме (без Cognito) можно войти с любым паролем:
- `user@test.com` — роль USER
- `tech@test.com` — роль TECH_SUPPORT
- `admin@test.com` — роль ADMIN
