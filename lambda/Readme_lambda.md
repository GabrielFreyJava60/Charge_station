# Charging Stations – Lambda Backends

Lambda functions for the Charging Stations Control System. They are invoked directly (e.g. from Node.js or run scripts) or by AWS (Cognito PostConfirmation and PostAuthentication triggers). Callers get a synchronous response; there is no SNS subscription.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `lambda/` | Single SAM template (`template.yaml`) and `samconfig.toml`; deploy from here. |
| `lambda/db` | DB and auth Lambdas (RDS, Cognito), run scripts, RDS table creation. |
| `lambda/routes` | Route Lambdas (e.g. health). |
| `lambda/layers/common` | Shared layer: logger, `log_audit`, data types, utils. |
| `lambda/tests/integration` | Integration tests that invoke deployed Lambdas. |

---

## Deployment

### Prerequisites

- **Docker Desktop** – installed and running (needed for `sam build --use-container` so dependencies such as psycopg2 build correctly).
- **AWS Secrets Manager** – a secret with at least `username` and `password`. The template uses **DBSecretArn** only to **initialise the RDS instance** at create time (CloudFormation resolves it). Lambdas use **IAM database authentication** at runtime (no secret at runtime).
- **VPC and private subnets** – template parameters: **VpcId**, **PrivateSubnet1Id**, **PrivateSubnet2Id** (same subnets for RDS, Lambdas, and VPC endpoints).
- **pgAdmin** (or any PostgreSQL client) – to connect to RDS once to run `GRANT rds_iam` for the DB user (one-time setup).

### Single stack (Cognito, RDS, Lambdas, Health)

From **`lambda`**:

```bash
sam build --use-container
sam deploy --guided   # first time; then sam deploy
```

Use `--use-container` so dependencies (e.g. psycopg2 on Python 3.12) build correctly. On first deploy, set VPC, subnets, DB secret ARN, invoker account ID(s); save to `samconfig.toml` for later runs.

The template provisions: **Cognito** (User Pool, client, groups ADMIN/USER/SUPPORT), **RDS** PostgreSQL (IAM auth, private), **VPC endpoints** (RDS API for auth tokens, Cognito IdP so the write Lambda can add users to groups from inside the VPC without NAT), **Lambdas** (WriteUserRDS, GetUserInfo, CreateRDSTables, ConfirmConsoleCreatedAdmin, Health), and permissions.

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
   GRANT rds_iam TO "<username>";
   ```
   (Use the same `username` as in the secret.)
4. Revert RDS to **Publicly accessible = No** and remove the temporary inbound rule.

### Adding a Cognito self-signup user

Use the **User Pool Client ID** from the stack output (or Cognito console). Replace `<region>`, `<client-id>`, `<email>`.

1. Sign up (username = email):
   ```bash
   aws cognito-idp sign-up --region <region> --client-id <client-id> --username <email> --password '<password>' --user-attributes Name=email,Value=<email> Name=name,Value="Your Name"
   ```
2. Confirm with the code from email:
   ```bash
   aws cognito-idp confirm-sign-up --region <region> --client-id <client-id> --username <email> --confirmation-code <code>
   ```
   The **WriteUserRDS** Lambda runs on PostConfirmation (and PostAuthentication), writes the user to RDS, and adds them to the Cognito group USER (or ADMIN for PostAuthentication).

---

## Access (cross-account)

Invoke permission is per **AWS account**. At deploy time, set:

- **InvokerAccountIdA** (and optionally **InvokerAccountIdB**) in the template parameters so those accounts can call the Lambdas.
- For CI or scripts, use the deployer account ID (e.g. `LAMBDA_ACCOUNT_ID`) when invoking by ARN.

---

## Functions

### Health – `charging-stations-health`

- **Payload:** `{}` or any JSON.
- **Response:** `{"code": 200, "status": "running"}`.
- **Invoker:** Cross-account (invoker account IDs in template).

**Integration test** (from `lambda`, with boto3 and IAM allowing `lambda:InvokeFunction`):

```bash
python -m tests.integration.routes.health_invoker <account_id>
```

---

### DB stack – functions

The template provisions **RDS** (PostgreSQL, IAM auth), **VPC endpoints** (RDS API for `generate_db_auth_token`, **Cognito IdP** so the write Lambda can call `AdminAddUserToGroup` from inside the VPC without NAT), and these Lambdas. DB Lambdas run in the VPC and use IAM database authentication (no Secrets Manager at runtime).

| Function | Purpose | Invoker |
|----------|---------|--------|
| **charging-stations-create-rds-tables** | Create RDS tables (e.g. `users`). | Script or cross-account. |
| **charging-stations-write-user-rds** | Write user to RDS and add to Cognito group. | Cognito (PostConfirmation + PostAuthentication). |
| **charging-stations-get-user-info** | Return user by `user_id` from RDS. | Backend or cross-account. |
| **charging-stations-confirm-console-created-admin** | Cognito auth (InitiateAuth, NEW_PASSWORD_REQUIRED with `name`). | Script or backend. |

**WriteUserRDS** – Triggered by Cognito PostConfirmation and PostAuthentication. Inserts the user into RDS (from `request.userAttributes`: sub, email, name, etc.) and calls Cognito `AdminAddUserToGroup` (role **USER** by default, **ADMIN** when `triggerSource` is PostAuthentication - for console-created user). **full_name** - if missing or Cognito sends the placeholder `cognito:default_val`, it is stored as **"Console User"**. Must return the same event to Cognito.

**ConfirmConsoleCreatedAdmin** – For first login (NEW_PASSWORD_REQUIRED), the Lambda sends `userAttributes.name` in the challenge response (default **"Console User"**) because console-created user by default does not have `name`. 

### Request/response (plain JSON)

- **CreateRDSTables** – Payload optional (e.g. `{"trigger": "script_run"}`). Returns handler result.
- **WriteUserRDS** – Event from Cognito. Returns the same event.
- **GetUserInfo** – Payload: `{"user_id": "<uuid>"}`. Response: `{"userId", "username", "email", "phone", "role", "status", "createdAt", "updatedAt"}` or `{"error": "..."}`.
- **ConfirmConsoleCreatedAdmin** – Payload: `{"username", "password", "new_password", "name"}` (`new_password` when NEW_PASSWORD_REQUIRED; `name` optional, default "Console User"). Response: `{"message", "accessToken", "idToken", "refreshToken"}` or exception.

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

### Integration tests

From **`lambda`** (with boto3 and IAM allowing `lambda:InvokeFunction` on the target account).

**Health** – no extra data needed; exits 0 on success:

```bash
python -m tests.integration.routes.health_invoker <invoker account_id>
```

**GetUserInfo** – requires a real `user_id` in RDS; asserts `StatusCode == 200` and `response_json['userId'] == user_id`:

```bash
python -m tests.integration.read.get_user_info_lambda_invoker <invoker account_id> <user_id>
```

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

Add the function resource and any `AWS::Lambda::Permission` (e.g. for cross-account or Cognito) in **`lambda/template.yaml`**. Use the same pattern as existing functions: `CodeUri`, `Handler`, `Layers`, `VpcConfig` for DB Lambdas, env vars, and IAM policies.
