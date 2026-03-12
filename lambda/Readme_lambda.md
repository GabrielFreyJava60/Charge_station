# Charging Stations – Lambda Backends

Lambda functions for the Charging Stations Control System. They are invoked directly (e.g. from Node.js or run scripts) or by AWS (Cognito Post Confirmation trigger). Callers get a synchronous response; there is no SNS subscription.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `lambda/routes` | Route Lambdas (e.g. health). One SAM template. |
| `lambda/db` | DB and auth Lambdas (RDS, Cognito), run scripts, RDS table creation. One SAM template. |
| `lambda/layers/common` | Shared layer: logger, `log_audit`, data types, utils. |
| `lambda/tests/integration` | Integration tests that invoke deployed Lambdas. |

---

## Deployment

### Prerequisites

- **Docker Desktop** – installed and running (needed for `sam build --use-container` when building the **db** stack; e.g. psycopg2).
- **AWS Secrets Manager** – a secret with PostgreSQL fields: `host`, `port`, `dbname`, `username`, `password`. The **db** template uses this secret only to **initialise the RDS instance credentials at create time** (CloudFormation resolves it), not at Lambda runtime.
- **Cognito User Pool** – **ALLOW_USER_PASSWORD_AUTH** enabled; email and username as required attributes. Template parameters: `CognitoClientId`, `CognitoUserPoolArn`.
- **pgAdmin** - to connect with the **db** in order to set up issuing IAM acess tokens to lambdas and run queries for dev purposes


### DB stack

From **`lambda/db`**:

```bash
sam build --use-container
sam deploy --guided   # first time; then sam deploy
```

Use `--use-container` so dependencies (e.g. psycopg2 on Python 3.12) build correctly. On first deploy, set VPC, subnets, DB secret ARN, Cognito IDs, invoker account ID(s); save to `samconfig.toml` for later runs.

After the DB instance is created, you must run a one‑time GRANT so the DB user can use IAM authentication. A simple way is:

1. In the RDS console, temporarily:
   - On the **Databases** tab of **Aurora and RDS** page select desired **db**, in Modify - Connectivity - Additional configuration set **Publicly accessible = Yes** apply the change and waid for **db** to modify.
   - In **db** - Security group rules find the security group attached to the DB and add an inbound rule:
     - Type: **PostgreSQL** (or **TCP** port `5432`)
     - Source: `<your public IP>/32`.
2. From your local machine, use **pgAdmin** - Query Tool Workspace - Welcome tab. Use the following data to connect:
   - **Host**: the RDS Endpoint from **db** - Endpoints .
   - **Port**: `5432`.
   - **Database**: the DB name from the template (default `charging_stations_rds_postgres`).
   - **Username / Password**: the `username` / `password` values from the Secrets Manager secret.
   - **Server Name**: choose name for the connection
   
3. Run:

   ```sql
   GRANT rds_iam TO `<db username (from the previous step)>`;
   ```

4. When done, **revert** the RDS instance to **Publicly accessible = No** and remove the temporary inbound rule from the security group.

### Routes stack

From **`lambda/routes`**:

```bash
sam build
sam deploy --guided   # first time; then sam deploy
```

No Docker required. Provide invoker account ID(s) when prompted.

### Adding a Cognito self-signup user

1. Sign up:
   ```bash
   aws cognito-idp sign-up --region <region> --client-id <client-id> --username <username> --password '<password>' --user-attributes Name=email,Value=<email>
   ```
2. Confirm with the code from email:
   ```bash
   aws cognito-idp confirm-sign-up --region <region> --client-id <client-id> --username <username> --confirmation-code <code>
   ```

---

## Access (cross-account)

Invoke permission is per **AWS account**. At deploy time, set:

- **InvokerAccountIdA** (and optionally **InvokerAccountIdB**) in the template parameters so those accounts can call the Lambdas.
- For CI or scripts, use the deployer account ID (e.g. `LAMBDA_ACCOUNT_ID`) when invoking by ARN.

---

## Routes stack – functions

### Health – `charging-stations-health`

- **Payload:** `{}` or any JSON.
- **Response:** `{"code": 200, "status": "running"}`.

**Integration test** (from `lambda`, with boto3 and IAM allowing `lambda:InvokeFunction`):

```bash
python -m tests.integration.routes.health_invoker <account_id>
```

Exits 0 on success; on failure prints assertion and traceback.

---

## DB stack – functions

The **db** template provisions RDS (PostgreSQL), VPC/security groups, an RDS interface VPC endpoint (for IAM token generation), four Lambdas, and permissions (cross-account + Cognito for WriteUserRDS).  
DB Lambdas use **IAM database authentication** (short‑lived auth tokens from the RDS API) instead of a stored DB password or Secrets Manager at runtime.

| Function | Purpose | Invoker |
|----------|---------|--------|
| **charging-stations-create-rds-tables** | Create RDS tables (e.g. `users`). | Script or cross-account. |
| **charging-stations-write-user-rds** | Insert user into RDS after sign-up. | Cognito (Post Confirmation trigger). |
| **charging-stations-get-user-info** | Return user by `user_id` from RDS. | Backend or cross-account. |
| **charging-stations-confirm-console-created-admin** | Cognito auth (initiate auth, new-password challenge). | Script or backend. |

### Request/response (plain JSON)

- **CreateRDSTables** – Payload optional (e.g. `{"trigger": "script_run"}`). Returns handler result.
- **WriteUserRDS** – Event from Cognito (`request.userAttributes`, `userName`). Must **return the same event** so Cognito continues.
- **GetUserInfo** – Payload: `{"user_id": "<uuid>"}`. Response: `{"userId", "username", "email", "phone", "role", "status", "createdAt", "updatedAt"}` or `{"error": "..."}`.
- **ConfirmConsoleCreatedAdmin** – Payload: `{"username", "password", "new_password"}` (`new_password` only when first login / NEW_PASSWORD_REQUIRED). Response: `{"message", "accessToken", "idToken", "refreshToken"}` or exception.

### Run scripts

From **`lambda/db`** (or `lambda` with env set). Ensure `.env` has the right region, account, and function names (see `.env.example`).

**Create RDS tables (run once after deploy):**

```bash
python run_create_rds_tables.py
```

**Confirm console-created admin (first login or password change):**

```bash
python run_confirm_console_created_admin.py <account_id> <username> <password> <new_password>
```

`new_password` is required only when Cognito returns the NEW_PASSWORD_REQUIRED challenge.

### Integration test – GetUserInfo

From **`lambda`**:

```bash
python -m tests.integration.read.get_user_info_lambda_invoker <account_id> <user_id>
```

Requires a real `user_id` in RDS. Asserts `StatusCode == 200` and `response_json['userId'] == user_id`.

---

## Environment variables

Copy **`lambda/.env.example`** to **`lambda/.env`** and set values for local runs and integration tests.

| Variable | Use |
|----------|-----|
| **REGION** / **AWS_REGION** | AWS region (e.g. `il-central-1`). |
| **AWS_LAMBDA_HOST_ACCOUNT** | Account where DB Lambdas are deployed (for scripts). |
| **CREATE_RDS_TABLES_FUNCTION_NAME**, **CONFIRM_CONSOLE_CREATED_ADMIN_FUNCTION_NAME**, **HEALTH_FUNCTION_NAME**, **READ_USER_INFO_LAMBDA_FUNCTION_NAME** | Function names; defaults match the templates. |
| **DB_HOST**, **DB_PORT**, **DB_NAME**, **DB_USER** | Set by the SAM template for DB Lambdas: RDS endpoint, port, database name, and DB user used with IAM auth. |

---

## Audit logging (CloudWatch)

Lambdas use **`log_audit`** (from `utils.logger` in the common layer) to write one JSON line per event (e.g. `message`, `userId`, `event`, `status`, `requestId`, `source`/`trigger`).

- **Log groups:** `/aws/lambda/<function-name>`.
- **Query:** CloudWatch → Logs → Logs Insights; filter by `event`, `status`, `userId`, `requestId` in the message.
- **Log level:** Optional `LOGGER_LEVEL` per function in the template (`Environment.Variables.LOGGER_LEVEL`, e.g. `INFO` or `DEBUG`).

---

## Adding new Lambdas

- **Routes:** Add the function resource and an `AWS::Lambda::Permission` for each invoker account in `lambda/routes/template.yaml`.
- **DB (or other stack):** Same pattern in that stack’s `template.yaml`: new function + permissions (and layers/env as needed).
