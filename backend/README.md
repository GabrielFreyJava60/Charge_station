# Charging Stations Backend (Express Gateway)

This backend is an **Express (Node.js + TypeScript)** service designed to run on **AWS ECS Fargate**.

The service acts as a **thin API Gateway** between the frontend and backend business logic.

## Responsibilities

The backend is responsible for:

- receiving HTTP requests from the frontend
- validating requests and routing them to services
- verifying **AWS Cognito JWT tokens** (optional in local development)
- optionally invoking **AWS Lambda (Python)** for business logic
- returning responses using agreed API contracts

The backend keeps business logic minimal and focuses on **API orchestration and AWS integration**.

---

## Architecture

```mermaid
flowchart LR
  FE[Frontend] -->|HTTP| GW[Express Gateway (ECS Fargate)]

  subgraph GW[Express Gateway]
  [ R-Routes / c-Controllers / S-Services ]
    R --> C
    C --> S
    S -->|optional| L[AWS Lambda (Python)]
  end
  L --> DDB[(DynamoDB)]
  L --> SNS[(SNS Topics)]
  GW --> CW[(CloudWatch Logs)]
  L --> CW

  FE -. auth .-> COG[AWS Cognito]
```

## Local Run

Requirements: Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

http://localhost:8000

### Health check

Frontend currently calls `GET /health`.

```bash
curl http://localhost:8000/health
```

Response contract:

```json
{ "code": 200, "status": "running" }

Error message
{
  "error": {
    "code": "LAMBDA_ERROR",
    "message": "Bad health response from lambda"
  }
}
```

## Welcome

```Bash:

  curl: http://localhost:8000/welcome

 Successful response:

{
  "code": 200,
  "data": [
    {
      "id": "st-001",
      "name": "Azrieli Fast Charge",
      "city": "Tel Aviv",
      "address": "132 Begin Rd",
      "providerName": "EV Power",
      "maxPowerKw": 150,
      "portCount": 4
    },
    {
      "id": "st-002",
      "name": "Haifa Port Station",
      "city": "Haifa",
      "address": "21 Independence Ave",
      "providerName": "ChargeIL",
      "maxPowerKw": 120,
      "portCount": 3
    }
  ]
}

Example error:
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

## Environment Variables

See `.env.example`.

Key variables:

- `PORT` (default `8000`)
- `API_PREFIX` (optional, e.g. `/api/v1`)
- `CORS_ORIGIN`

### Health Lambda (optional)

- `USE_LAMBDA=false|true`
- `AWS_REGION`
- `HEALTH_LAMBDA_FUNCTION_NAME`

## Cognito Auth

Provides Cognito configuration for the frontend.

endpoint : GET /auth/config

Successful response:
{
"code": 200,
"data": {
"region": "il-central-1",
"userPoolId": "...",
"clientId": "..."
}
}
Example error:
{
"error": {
"code": "UNAUTHORIZED",
"message": "Missing Authorization Bearer token"
}
}

### Health

- `GET /health` (also available as `${API_PREFIX}/health` if `API_PREFIX` is set)

Response:

```json
{ "code": 200, "status": "running" }
```

### Auth

- `GET /auth/config`

Response:

```json
{
  "code": 200,
  "data": {
    "region": "il-central-1",
    "userPoolId": "...",
    "clientId": "..."
  }
}

Example error :
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing Authorization Bearer token"
  }
}
```

### Users

- `GET /users/me` (JWT required unless `AUTH_DISABLED=true`)

Response:

```json
{
  "code": 200,
  "data": {
    "userId": "...",
    "email": "...",
    "username": "...",
    "groups": []
  }
}
```

### Stations (skeleton)

- `GET /stations`

Response:

````json
{ "code": 200, "data": [ { "stationId": "st-001", "name": "..." } ] }
```+

- `GET /stations/:stationId`

Response:
```json
{ "code": 200, "data": { "stationId": "st-001", "name": "..." } }
````

### Bookings (skeleton)

- `GET /bookings` (JWT required)

Response:

```json
{ "code": 200, "data": [{ "bookingId": "bk-...", "status": "created" }] }
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description"
  }
}
```

Create booking:

- `POST /bookings` (JWT required)

Request:

```json
{
  "stationId": "st-001",
  "slotFrom": "2026-02-23T10:00:00Z",
  "slotTo": "2026-02-23T11:00:00Z"
}
```

Response:

```json
{
  "code": 201,
  "data": {
    "bookingId": "bk-...",
    "status": "created"
  }
}
```

Cancel booking

- `DELETE /bookings/:bookingId` (JWT required)

Response:

```json
{
  "code": 200,
  "data": {
    "bookingId": "bk-...",
    "status": "cancelled"
  }
}
```

## ECS Fargate Deployment Notes

Minimal steps (high level):

1. Build & push Docker image to **ECR**.
2. Create an ECS **Task Definition** with env vars.
3. Create an ECS **Service** (Fargate) behind an **ALB**.
4. Configure ALB health check path to `/health`.

This repository includes a production Dockerfile: `backend/Dockerfile`.

## CloudWatch Logs

- ECS task logs should be routed to a log group (configured in Task Definition).
- Lambda logs go to CloudWatch by default.

## Error Examples:

### ```Invalid request parameters

HTTP Status: 400

{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters"
  }
}
```

### ```Unauthorized request

HTTP Status: 401

{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization token"
  }
}
```


### ```Lambda invocation error

### ```Internal server error

HTTP Status: 500

{
  "error": {
    "code": "LAMBDA_ERROR",
    "message": "Bad response from Lambda service"
  }
}
```
