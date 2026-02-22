# Microservices — AWS Lambda (Python)

## Архитектура микросервисов

```
EventBridge (rate: 1 min)
   │
   ▼
┌──────────────────────┐
│ Charging Simulator   │ ──► DynamoDB (Sessions, Stations)
│ (charging_simulator) │ ──► Notification Service
└──────────────────────┘

Backend (Express) ─────────► Health Check Lambda ──► DynamoDB
   │
   ├──► Station Service Lambda ──► DynamoDB (Stations)
   ├──► Session Service Lambda ──► DynamoDB (Sessions, Stations)
   └──► Notification Service Lambda ──► DynamoDB (ErrorLogs) / SNS
```

## Список Lambda-функций

| Функция | Триггер | Описание |
|---|---|---|
| `health_check` | Backend (Invoke) | Проверяет доступность Lambda + DynamoDB |
| `charging_simulator` | EventBridge (1 мин) | Симуляция зарядки для активных сессий |
| `station_service` | Backend (Invoke) | CRUD станций, переходы состояний |
| `session_service` | Backend (Invoke) | Управление сессиями зарядки |
| `notification_service` | Invoke | Отправка уведомлений (mock SNS → DynamoDB) |

## Shared Layer

`lambdas/shared/` — общий код, подключается как Lambda Layer:

- `models.py` — Domain models (Station, Port, Session, ErrorLog) + конечные автоматы
- `db.py` — DynamoDB helpers (get, put, query, update, delete, scan, GSI queries)
- `logger.py` — Structured JSON logging для CloudWatch
- `exceptions.py` — Кастомные исключения (AppError, NotFoundError, ConflictError, etc.)

## Обоснование выбора DynamoDB

### Почему DynamoDB, а не PostgreSQL/MySQL?

1. **Serverless-native**: DynamoDB не требует управления серверами БД, идеально сочетается с Lambda.
2. **PAY_PER_REQUEST**: Оплата за фактические запросы, а не за выделенные ресурсы — экономично для учебного проекта.
3. **Низкая латентность**: Single-digit millisecond response time для key-value запросов (критично для симулятора, который обновляет сессии каждые 10 секунд).
4. **Conditional Writes**: Поддержка условных записей для обработки параллельных операций (2+ зарядки одновременно).
5. **GSI (Global Secondary Indexes)**: Позволяют эффективно запрашивать данные по разным атрибутам (status, userId, level).
6. **Интеграция с IAM**: Тонкая настройка доступа — каждая Lambda получает минимально необходимые права.
7. **Auto-scaling**: Автоматически масштабируется при росте нагрузки.

### Компромиссы

- Нет JOIN: Вместо реляционных связей используем денормализацию и GSI.
- Ограниченные запросы: Нельзя делать произвольные SQL-запросы, но для нашей доменной модели это не нужно.
- Стоимость GSI: Каждый GSI дублирует данные, но при PAY_PER_REQUEST стоимость минимальна.

## Структура таблиц DynamoDB

### Stations
```
PK                      SK              Содержимое
STATION#station-001     METADATA        name, address, lat/lng, status, power, tariff
STATION#station-001     PORT#port-001   portNumber, status
STATION#station-001     PORT#port-002   portNumber, status
```
GSI: `status-index` (PK: status, SK: stationId)

### Sessions
```
PK                      SK              Содержимое
SESSION#sess-001        METADATA        userId, stationId, portId, status, charge%, cost
```
GSI: `userId-index` (PK: userId, SK: createdAt), `status-index` (PK: status, SK: updatedAt)

### Users
```
PK                      SK              Содержимое
USER#uuid-123           METADATA        email, name, role, blocked
```

### ErrorLogs
```
PK                      SK              Содержимое
ERROR#uuid-err          2026-02-22T...  service, level, message, logStatus
```
GSI: `level-index`, `service-index`, `status-index`

## Конечные автоматы

### Станция
```
NEW → ACTIVE (Admin commission)
ACTIVE → MAINTENANCE (TechSupport)
ACTIVE → OUT_OF_ORDER (TechSupport)
MAINTENANCE → ACTIVE (TechSupport)
OUT_OF_ORDER → ACTIVE (TechSupport)
```

### Порт
```
FREE → CHARGING (Session starts)
CHARGING → FREE (Session completes)
CHARGING → ERROR (Failure)
ERROR → FREE (TechSupport resets)
```

### Сессия зарядки
```
STARTED → IN_PROGRESS (Simulator tick)
IN_PROGRESS → IN_PROGRESS (Simulator tick)
IN_PROGRESS → COMPLETED (100%)
IN_PROGRESS → INTERRUPTED (User/TechSupport stops)
IN_PROGRESS → FAILED (Error)
STARTED → FAILED (Error)
```

## Модель нелинейной зарядки

```python
def calculate_power_factor(charge_percent):
    if charge_percent < 70:
        return 1.0       # 100% мощности
    elif charge_percent < 90:
        return 0.6       # 60% мощности
    else:
        return 0.3       # 30% мощности
```

Параметры: мощность станции / кол-во активных портов × power_factor × интервал

## SAM Template

`infrastructure/template.yaml` определяет:
- Cognito User Pool + 3 группы (ADMIN, TECH_SUPPORT, USER)
- 4 DynamoDB таблицы с GSI
- 5 Lambda-функций + Shared Layer
- EventBridge Schedule для симулятора
- IAM Policies (DynamoDBCrudPolicy / DynamoDBReadPolicy)

### Параметры развёртывания
```
Environment: dev | prod
CognitoDomain: ev-charging-station
```

## Кросс-аккаунтная интеграция Lambda

Для подключения Lambda на разных AWS-аккаунтах (см. [документацию](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-cross-account-lambda-integrations.html)):

1. Lambda на аккаунте B должна иметь resource-based policy, разрешающую invoke с аккаунта A.
2. На аккаунте A создаётся IAM role с правом `lambda:InvokeFunction` на ARN Lambda аккаунта B.
3. API Gateway / backend использует этот ARN для cross-account invoke.

## Запуск локально

```bash
# Через SAM CLI
cd infrastructure
sam build
sam local invoke HealthCheckFunction --event '{"source": "test"}'

# Через AWS CLI (после деплоя)
aws lambda invoke \
  --function-name ev-health-check-dev \
  --payload '{"source": "cli-test"}' \
  response.json
cat response.json
```
