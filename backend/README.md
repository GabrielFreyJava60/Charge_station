# Backend — Node.js/Express API Gateway

## Архитектура

```
Express Server (ECS Fargate)
├── middleware/
│   ├── auth.js         — JWT-верификация через Cognito JWKS
│   ├── rbac.js         — RBAC на основе permissions
│   ├── logger.js       — Morgan request logging
│   └── errorHandler.js — Централизованная обработка ошибок
├── routes/
│   ├── auth.js         — /api/auth/*      (публичные)
│   ├── stations.js     — /api/stations/*  (все роли)
│   ├── sessions.js     — /api/sessions/*  (USER + выше)
│   ├── admin.js        — /api/admin/*     (только ADMIN)
│   └── techSupport.js  — /api/tech-support/* (TECH_SUPPORT + ADMIN)
├── services/
│   ├── cognitoService.js  — Работа с AWS Cognito
│   ├── stationService.js  — Бизнес-логика станций
│   ├── sessionService.js  — Бизнес-логика сессий зарядки
│   └── userService.js     — Управление пользователями в DynamoDB
└── utils/
    ├── dynamodb.js     — DynamoDB Document Client
    ├── errors.js       — Кастомные классы ошибок
    └── validators.js   — Валидация входных данных
```

## Конфигурация

Все настройки через переменные окружения (`.env`):

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3001` |
| `NODE_ENV` | Окружение | `development` |
| `AWS_REGION` | AWS регион | `us-east-1` |
| `COGNITO_USER_POOL_ID` | ID Cognito User Pool | — |
| `COGNITO_CLIENT_ID` | ID Cognito App Client | — |
| `DYNAMODB_ENDPOINT` | Endpoint DynamoDB (локальный) | — |
| `DYNAMODB_STATIONS_TABLE` | Имя таблицы станций | `Stations` |
| `DYNAMODB_SESSIONS_TABLE` | Имя таблицы сессий | `Sessions` |
| `DYNAMODB_USERS_TABLE` | Имя таблицы пользователей | `Users` |
| `DYNAMODB_ERROR_LOGS_TABLE` | Имя таблицы логов ошибок | `ErrorLogs` |
| `HEALTH_CHECK_LAMBDA` | Имя Health Lambda | `ev-health-check-dev` |
| `CORS_ORIGIN` | Разрешённый origin | `http://localhost:5173` |
| `LOG_LEVEL` | Уровень логирования | `debug` |

## RBAC — Модель ролей и разрешений

| Разрешение | USER | TECH_SUPPORT | ADMIN |
|---|---|---|---|
| `stations:read` | yes | yes | yes |
| `stations:create` | — | — | yes |
| `stations:set_mode` | — | yes | yes |
| `stations:update_tariff` | — | — | yes |
| `sessions:create` | yes | — | yes |
| `sessions:read` | yes | yes | yes |
| `sessions:stop_own` | yes | — | yes |
| `sessions:force_stop` | — | yes | yes |
| `errors:read` | — | yes | yes |
| `errors:update` | — | yes | yes |
| `stats:read` | — | yes | yes |
| `users:manage` | — | — | yes |

---

## API Контракты

### Health Check

#### `GET /health`
Простая проверка работоспособности Gateway.

**Query Parameters:**
- `full=true` — вызывает Lambda + проверяет DynamoDB (полная цепочка)

**Response (200):**
```json
{
  "service": "ev-charging-backend",
  "status": "ok",
  "timestamp": "2026-02-22T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "totalResponseTimeMs": 125,
  "checks": {
    "gateway": { "status": "ok" },
    "lambda": {
      "status": "ok",
      "responseTimeMs": 85,
      "checks": {
        "lambda": { "status": "ok", "functionName": "ev-health-check-dev" },
        "dynamodb": { "status": "ok", "stationsTable": "Stations" },
        "data": { "stationCount": 2 }
      }
    }
  }
}
```

---

### Аутентификация — `/api/auth`

#### `POST /api/auth/register`
Регистрация нового пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "Иван Иванов",
  "phoneNumber": "+79991234567"  // опционально
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "userId": "uuid-123",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "confirmed": false
  }
}
```

#### `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "idToken": "eyJhbGciOi...",
  "refreshToken": "eyJjdHki...",
  "expiresIn": 3600,
  "userId": "uuid-123",
  "email": "user@example.com",
  "role": "USER"
}
```

#### `POST /api/auth/refresh`

**Request Body:**
```json
{ "refreshToken": "eyJjdHki..." }
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "idToken": "eyJhbGciOi...",
  "expiresIn": 3600
}
```

---

### Станции — `/api/stations`

> Требуется `Authorization: Bearer <token>` для всех запросов.

#### `GET /api/stations`
**Query:** `?status=ACTIVE` (опционально)

**Response (200):**
```json
{
  "stations": [
    {
      "stationId": "station-001",
      "name": "Downtown Charging Hub",
      "address": "123 Main Street",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "totalPorts": 3,
      "powerKw": 150,
      "tariffPerKwh": 0.35,
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/stations/:id`
**Response (200):**
```json
{
  "station": {
    "stationId": "station-001",
    "name": "Downtown Charging Hub",
    "address": "123 Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "totalPorts": 3,
    "powerKw": 150,
    "tariffPerKwh": 0.35,
    "status": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "ports": [
      { "portId": "port-001", "stationId": "station-001", "portNumber": 1, "status": "FREE" },
      { "portId": "port-002", "stationId": "station-001", "portNumber": 2, "status": "CHARGING" }
    ]
  }
}
```

#### `POST /api/stations` (ADMIN)

**Request Body:**
```json
{
  "name": "New Station",
  "address": "456 Oak Avenue",
  "latitude": 40.65,
  "longitude": -73.95,
  "totalPorts": 4,
  "powerKw": 250,
  "tariffPerKwh": 0.45
}
```

**Response (201):**
```json
{ "station": { "stationId": "station-abc123", "status": "NEW", "..." : "..." } }
```

#### `PATCH /api/stations/:id/status` (TECH_SUPPORT, ADMIN)

**Request Body:**
```json
{ "status": "MAINTENANCE" }
```
Допустимые переходы: NEW→ACTIVE, ACTIVE→MAINTENANCE, ACTIVE→OUT_OF_ORDER, MAINTENANCE→ACTIVE, OUT_OF_ORDER→ACTIVE

#### `PATCH /api/stations/:id/tariff` (ADMIN)

**Request Body:**
```json
{ "tariffPerKwh": 0.50 }
```

---

### Сессии зарядки — `/api/sessions`

#### `POST /api/sessions/start` (USER)

**Request Body:**
```json
{
  "stationId": "station-001",
  "portId": "port-001",
  "batteryCapacityKwh": 75
}
```

**Response (201):**
```json
{
  "session": {
    "sessionId": "sess-abc123",
    "userId": "uuid-user",
    "stationId": "station-001",
    "portId": "port-001",
    "status": "STARTED",
    "chargePercent": 0,
    "energyConsumedKwh": 0,
    "totalCost": 0,
    "tariffPerKwh": 0.35,
    "batteryCapacityKwh": 75,
    "createdAt": "2026-02-22T12:00:00Z",
    "updatedAt": "2026-02-22T12:00:00Z"
  }
}
```

#### `POST /api/sessions/:id/stop` (USER — свою, TECH_SUPPORT — любую)

**Response (200):**
```json
{
  "session": {
    "sessionId": "sess-abc123",
    "status": "INTERRUPTED",
    "chargePercent": 65.5,
    "totalCost": 12.30,
    "completedAt": "2026-02-22T12:30:00Z"
  }
}
```

#### `GET /api/sessions/active` (USER)
#### `GET /api/sessions/history` (USER)
#### `GET /api/sessions/all` (TECH_SUPPORT, ADMIN) — `?status=IN_PROGRESS`
#### `GET /api/sessions/:id`

---

### Администрирование — `/api/admin` (ADMIN)

#### `GET /api/admin/users`
#### `PATCH /api/admin/users/:id/role` — `{ "role": "TECH_SUPPORT" }`
#### `PATCH /api/admin/users/:id/block` — `{ "blocked": true }`
#### `DELETE /api/admin/users/:id`
#### `POST /api/admin/stations` — создание станции
#### `PATCH /api/admin/stations/:id/commission` — ввод в эксплуатацию (NEW→ACTIVE)
#### `PATCH /api/admin/stations/:id/tariff` — `{ "tariffPerKwh": 0.50 }`

---

### Тех. поддержка — `/api/tech-support` (TECH_SUPPORT, ADMIN)

#### `GET /api/tech-support/errors` — `?level=ERROR` или `?status=NEW` или `?service=charging_simulator`

**Response (200):**
```json
{
  "errors": [
    {
      "errorId": "uuid-err",
      "service": "charging_simulator",
      "level": "ERROR",
      "message": "Session processing failed",
      "status": "NEW",
      "details": "...",
      "timestamp": "2026-02-22T12:00:00Z"
    }
  ]
}
```

#### `PATCH /api/tech-support/errors/:id/status`
```json
{ "status": "RESOLVED", "timestamp": "2026-02-22T12:00:00Z" }
```

#### `PATCH /api/tech-support/stations/:id/mode`
```json
{ "status": "MAINTENANCE" }
```

#### `POST /api/tech-support/sessions/:id/force-stop`

#### `GET /api/tech-support/stats`

**Response (200):**
```json
{
  "stats": {
    "activeSessions": 5,
    "totalStations": 10,
    "totalPorts": 30,
    "occupiedPorts": 5,
    "portOccupancyPercent": 16.67,
    "faultyStations": 1,
    "stationsByStatus": { "ACTIVE": 8, "NEW": 0, "MAINTENANCE": 1, "OUT_OF_ORDER": 1 }
  }
}
```

---

### Коды ошибок

| Код | errorCode | Описание |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Неверные входные данные |
| 400 | `INVALID_TRANSITION` | Недопустимый переход состояния |
| 401 | `UNAUTHORIZED` | Отсутствует или невалидный JWT |
| 403 | `FORBIDDEN` | Недостаточно прав |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 409 | `CONFLICT` | Конфликт (порт занят, сессия активна) |
| 500 | `INTERNAL_ERROR` | Внутренняя ошибка |

## Запуск

```bash
cp .env.example .env
npm install
npm run dev
```

## Docker

```bash
docker build -t ev-charging-backend .
docker run -p 3001:3001 --env-file .env ev-charging-backend
```
