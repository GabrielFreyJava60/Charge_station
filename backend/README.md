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

<http://localhost:8000>

### Health checks

Backend exposes two health endpoints:

- **Shallow health** (`GET /health`) checks only that the backend API process is running.
- **Deep health** (`GET /health/api`) checks backend-to-Lambda connectivity by invoking the health Lambda.

Examples:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/api
```

Response contract:

```json
{ "code": 200, "status": "ok" }
```

Possible deep-health failures:

```json
{ "code": 502, "status": "bad-health-response" }
{ "code": 502, "status": "no-lambda-response" }
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

### Health Lambda

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
- `GET /health/api` (also available as `${API_PREFIX}/health/api` if `API_PREFIX` is set)

`/health` is shallow (backend-only), while `/health/api` is deep (invokes the health Lambda).

Response:

```json
{ "code": 200, "status": "ok" }
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

## Full Backend Deployment Procedure (ECS Fargate + SAM)

This procedure covers Docker image build, push to ECR, parameter configuration in `template.yaml`, and stack deploy/delete.

### 1) Prerequisites

- AWS CLI authenticated (`aws configure` or SSO login)
- Docker installed and running
- AWS SAM CLI installed
- IAM permissions for ECR, CloudFormation, ECS, ELB, Logs, IAM

### 2) Build Docker image

From repository root:

```bash
cd backend
docker build -t charging-stations-backend:latest .
```

### 3) Push image to Amazon ECR

Set your values and run:

```bash
AWS_REGION=il-central-1
AWS_ACCOUNT_ID=852215679994
ECR_REPOSITORY=charging-stations
IMAGE_TAG=latest

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag charging-stations-backend:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
```

Use the pushed image URI as `ImageUri` in deploy parameters.

### 4) Configure deploy parameters

Update parameter values in one of these places:

- `backend/template.yaml` (Parameter defaults)
- `backend/samconfig.toml` (`parameter_overrides`)
- CLI `sam deploy --parameter-overrides ...`

Important parameters in `template.yaml`:

- Network: `VpcId`, `PublicSubnets`
- Image/runtime: `ImageUri`, `ContainerPort`, `ContainerCpu`, `ContainerMemory`
- Health checks: `HealthCheckPath` (recommended: `/health` for ALB shallow checks)
- Lambda integration: `LambdaRegion`, `LambdaAccountId`, `LambdaHealthName`
- Scaling: `DesiredCount`
- Auth config: `CognitoUserPoolId`, `CognitoClientId`, `CognitoRegion`

### 5) Deploy stack

From `backend`:

```bash
sam build
sam deploy
```

If you need explicit values:

```bash
sam deploy \
  --stack-name charge-st \
  --capabilities CAPABILITY_IAM \
  --region il-central-1 \
  --parameter-overrides \
    ImageUri="773769103104.dkr.ecr.il-central-1.amazonaws.com/charging-stations:latest" \
    HealthCheckPath="/health" \
    DesiredCount="1"
```

After deployment, get ALB DNS:

```bash
aws cloudformation describe-stacks \
  --stack-name charge-st \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDnsName'].OutputValue" \
  --output text
```

### 6) Validate health after deploy

```bash
curl http://<alb-dns>/health
curl http://<alb-dns>/health/api
```

### 7) Delete stack

```bash
sam delete --stack-name charge-st --region il-central-1
```

## CloudWatch Logs

- ECS task logs should be routed to a log group (configured in Task Definition).
- Lambda logs go to CloudWatch by default.

## Error Examples

### Invalid request parameters

HTTP Status: 400

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters"
  }
}
```

### Unauthorized request

HTTP Status: 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization token"
  }
}
```

### Internal server error

HTTP Status: 500

```json
{
  "error": {
    "code": "LAMBDA_ERROR",
    "message": "Bad response from Lambda service"
  }
}
```
