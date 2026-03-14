import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  type InitiateAuthCommandInput,
  type SignUpCommandInput,
  type ConfirmSignUpCommandInput,
  type InitiateAuthCommandOutput,
  type AuthenticationResultType,
  type ResendConfirmationCodeRequest,
  ResendConfirmationCodeCommand,
  UserNotConfirmedException,
} from "@aws-sdk/client-cognito-identity-provider";
import { getLogger } from '@/services/logging';
import { config } from '@/config/env';
import { parseJwt } from "./jwtService";
import type { AuthDataType, AuthPayload, UserRole } from "@/types";
import { NotConfirmedError } from "@/types/errors";
import { ADMIN_GROUP_NAME, SUPPORT_GROUP_NAME } from "@/types/constants";

const logger = getLogger("authService");

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.cognitoRegion,
});

export const initiateSignIn = async (email: string, password: string): Promise<AuthenticationResultType | undefined> => {
  const params: InitiateAuthCommandInput = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.cognitoClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };
  const command = new InitiateAuthCommand(params);
  try {
    const cognitoResponse: InitiateAuthCommandOutput = await cognitoClient.send(command);
    logger.debug(".initiateSignIn Cognito response: ", cognitoResponse);
    const authenticationResult = cognitoResponse.AuthenticationResult;
    logger.debug(".initiateSignIn authentication result: ", authenticationResult);
    
    return authenticationResult;
  } catch (error) {
    if (error instanceof UserNotConfirmedException) {
      throw new NotConfirmedError(error.message, { cause: error });
    }
    throw error;
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  const params: SignUpCommandInput = {
    ClientId: config.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: name,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    logger.debug(".signUp command: ", command);
    const response = await cognitoClient.send(command);
    logger.debug("Sign up success, Response=", response);
    return response;
  } catch (error) {
    logger.error("Error signing up: ", error);
    throw error;
  }
};

export const confirmSignUp = async (username: string, code: string) => {
  const params: ConfirmSignUpCommandInput = {
    ClientId: config.cognitoClientId,
    Username: username,
    ConfirmationCode: code,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    logger.debug("User confirmed successfully");
    return true;
  } catch (error) {
    logger.error("Error confirming sign up: ", error);
    throw error;
  }
};

export const resendConfirmationCode = async (username: string) => {
  const input: ResendConfirmationCodeRequest = {
    ClientId: config.cognitoClientId,
    Username: username,
  };
  const command = new ResendConfirmationCodeCommand(input);
  try {
    const response = await cognitoClient.send(command);
    console.debug(".ResendConfirmationCode response: ", response);
  } catch (error) {
    logger.error("Error resending confirmation code: ", error);
    throw error;
  }
}

function getUserRole(userGroups: string[]): UserRole {
  if (userGroups.includes(ADMIN_GROUP_NAME)) {
    return "ADMIN";
  }
  if (userGroups.includes(SUPPORT_GROUP_NAME)) {
    return "SUPPORT";
  }
  return "USER";
}

export const signIn = async (email: string, password: string): Promise<AuthDataType> => {
  const authResult = await initiateSignIn(email, password);
  if (!authResult) {
    throw Error("Empty authentication result");
  }
  const { AccessToken, IdToken } = authResult;
  if (!AccessToken) {
    throw Error("No access token retrieved");
  }
  if (!IdToken) {
    throw new Error("No ID token retrieved");
  }
  const payload: AuthPayload = parseJwt(IdToken);
  const sub = payload?.sub;
  if (!sub) {
    throw Error("Wrong token format");
  }
  const userRole = getUserRole(payload["cognito:groups"] ?? []);
  return {
    user: { id: sub, email: payload.email ?? email, userRole },
    session: {accessToken: AccessToken},
  }
}