# Система управления зарядными станциями для электромобилей

Распределённая микросервисная система для управления сетью зарядных станций ЭМ в гипотетическом городе.

## Архитектурная схема

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                         │
│                                                                     │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ │
│  │ Dashboard │ │ Stations  │ │ Charging  │ │ Tech     │ │ Admin  │ │
│  │ + Health  │ │ List/Det  │ │ Session   │ │ Support  │ │ Panel  │ │
│  └──────────┘ └───────────┘ └───────────┘ └──────────┘ └────────┘ │
│                    Redux Store (auth, stations, sessions, etc.)     │
│                         Axios + JWT Interceptor                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (JWT Bearer Token)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               BACKEND — Node.js/Express (ECS Fargate)               │
│                                                                     │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────────────────┐   │
│  │ JWT Auth   │→ │ RBAC      │→ │ Routes                       │   │
│  │ (Cognito)  │  │ Middleware │  │ /auth /stations /sessions    │   │
│  └────────────┘  └───────────┘  │ /admin /tech-support /health │   │
│                                  └──────────────┬───────────────┘   │
│                                                 │                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Services: cognitoService, stationService, sessionService,   │   │
│  │           userService                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ DynamoDB SDK                     │ Lambda Invoke
               ▼                                  ▼
┌──────────────────────┐      ┌──────────────────────────────────────┐
│     AWS DynamoDB     │      │         AWS Lambda (Python)          │
│                      │      │                                      │
│ ┌──────────────────┐ │      │ ┌──────────────┐ ┌────────────────┐ │
│ │ Stations         │ │◄─────│ │ Health Check │ │ Station Service│ │
│ │ (+ Ports as SK)  │ │      │ └──────────────┘ └────────────────┘ │
│ ├──────────────────┤ │      │ ┌──────────────┐ ┌────────────────┐ │
│ │ Sessions         │ │◄─────│ │ Session Svc  │ │ Notification   │ │
│ ├──────────────────┤ │      │ └──────────────┘ └────────────────┘ │
│ │ Users            │ │      │ ┌──────────────────────────────────┐ │
│ ├──────────────────┤ │◄─────│ │ Charging Simulator              │ │
│ │ ErrorLogs        │ │      │ │ (EventBridge: rate 1 min)       │ │
│ └──────────────────┘ │      │ │ Нелинейная модель зарядки       │ │
└──────────────────────┘      │ └──────────────────────────────────┘ │
                              │         Shared Lambda Layer          │
                              │   (models, db, logger, exceptions)   │
                              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Infrastructure                          │
│  Cognito (Auth) │ EventBridge │ CloudWatch │ SNS │ Secrets Manager │
│                         IaC: SAM / CloudFormation                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Структура проекта

| Директория | Описание | README |
|---|---|---|
| `backend/` | Node.js/Express API Gateway (ECS Fargate) | [backend/README.md](backend/README.md) |
| `frontend/` | React SPA (Vite + Tailwind + Redux) | [frontend/README.md](frontend/README.md) |
| `lambdas/` | Python Lambda-функции (бизнес-логика) | [lambdas/README.md](lambdas/README.md) |
| `infrastructure/` | SAM/CloudFormation шаблоны | — |
| `scripts/` | Скрипты развёртывания | — |

## Роли пользователей

| Роль | Описание | Доступ |
|---|---|---|
| **USER** | Клиент, пользователь зарядных станций | Просмотр станций, зарядка, история |
| **TECH_SUPPORT** | Техническая поддержка | Мониторинг, управление режимами, принудительная остановка |
| **ADMIN** | Администратор | Всё + управление пользователями, создание станций, тарифы |

## Цепочка Health Check

```
Frontend (кнопка Health)
   │
   ▼ GET /health?full=true
Backend (Express)
   │
   ▼ Lambda Invoke
Health Check Lambda
   │
   ▼ DynamoDB scan
DynamoDB (проверка таблиц)
   │
   ▼ Response через всю цепочку
Frontend (отображение JSON)
```

**Этап пройден, когда Health-запрос проходит через всю цепочку, и response отображается на главной странице.**

## Технологический стек

| Компонент | Технология |
|---|---|
| Frontend | React 18, Redux Toolkit, Tailwind CSS, Vite |
| Backend | Node.js 18, Express, JWT, JWKS |
| Microservices | Python 3.11, AWS Lambda |
| Database | AWS DynamoDB (PAY_PER_REQUEST) |
| Auth | AWS Cognito (User Pool + Groups) |
| Notifications | AWS SNS (mock → DynamoDB в dev) |
| Monitoring | AWS CloudWatch, structured JSON logs |
| Scheduling | AWS EventBridge |
| IaC | AWS SAM / CloudFormation |
| Deployment | ECS Fargate (backend), S3+CloudFront (frontend) |

## Быстрый старт

```bash
# 1. Локальная DynamoDB + seed-данные
./scripts/setup-local.sh

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run dev          # → http://localhost:3001

# 3. Frontend
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

## Dev-режим

Без настроенного AWS Cognito можно войти с любым паролем:
- `user@test.com` → роль USER
- `tech@test.com` → роль TECH_SUPPORT
- `admin@test.com` → роль ADMIN

## Развёртывание

```bash
./scripts/deploy.sh dev    # dev-окружение
./scripts/deploy.sh prod   # production
```
