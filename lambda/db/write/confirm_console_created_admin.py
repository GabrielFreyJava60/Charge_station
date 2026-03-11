import json
import os
import boto3
from botocore.exceptions import ClientError
from utils.logger import logger

CLIENT_ID = os.environ["COGNITO_CLIENT_ID"]          # from template
COGNITO_REGION = os.environ.get("COGNITO_REGION", "il-central-1")


def initiate_auth(client, username: str, password: str) -> dict:
    return client.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        ClientId=CLIENT_ID,
        AuthParameters={
            "USERNAME": username,
            "PASSWORD": password,
        },
    )


def respond_to_new_password_challenge(
    client, username: str, new_password: str, session: str
) -> dict:
    return client.respond_to_auth_challenge(
        ClientId=CLIENT_ID,
        ChallengeName="NEW_PASSWORD_REQUIRED",
        Session=session,
        ChallengeResponses={
            "USERNAME": username,
            "NEW_PASSWORD": new_password,
        },
    )


def handler(event, context):
    try:

        if isinstance(event, str):
            request_body = json.loads(event)
        else:
            request_body = event or {}

        username = request_body.get("username")
        password = request_body.get("password")
        new_password = request_body.get("new_password")

        if not username or not password:
            raise ValueError("Username and password are required")

        client = boto3.client("cognito-idp", region_name=COGNITO_REGION)

        resp = initiate_auth(client, username, password)
        logger.info(f"initiate_auth response: {json.dumps(resp, default=str)}")

        challenge_name = resp.get("ChallengeName")

        # First login: NEW_PASSWORD_REQUIRED challenge
        if challenge_name == "NEW_PASSWORD_REQUIRED":
            if not new_password:
                raise ValueError("New password is required during first login")

            resp = respond_to_new_password_challenge(
                client, username, new_password, resp["Session"]
            )
            logger.info(
                f"respond_to_auth_challenge response: {json.dumps(resp, default=str)}"
            )
            message = "Password changed and login successful"
        elif challenge_name:
            # Some other challenge we don't handle here
            raise ValueError(f"Unsupported Cognito challenge: {challenge_name}")
        else:
            # No challenge => normal successful auth
            message = "Login successful"

        auth_result = resp.get("AuthenticationResult", {}) or {}

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": message,
                    "accessToken": auth_result.get("AccessToken"),
                    "idToken": auth_result.get("IdToken"),
                    "refreshToken": auth_result.get("RefreshToken"),
                }
            ),
        }

    except ClientError as e:
        logger.error(f"Cognito client error: {e}", exc_info=True)
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid username or password"}),
        }
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)}),
        }