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
} from "@aws-sdk/client-cognito-identity-provider";
import { getLogger } from '@/services/logging';
import { config } from '@/config/env';
import { parseJwt } from "./jwtService";
import type { AuthDataType, AuthPayload, UserRole } from "@/types";

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
  const cognitoResponse: InitiateAuthCommandOutput = await cognitoClient.send(command);
  logger.debug(".initiateSignIn Cognito response: ", cognitoResponse);
  const authenticationResult = cognitoResponse.AuthenticationResult;
  logger.debug(".initiateSignIn authentication result: ", authenticationResult);
    
  return authenticationResult;
};

export const signIn = async (email: string, password: string): Promise<AuthDataType> => {
  const authResult = await initiateSignIn(email, password);
  if (!authResult) {
    throw Error("Empty authentication result!");
  }
  const { AccessToken, IdToken } = authResult;
  if (!AccessToken) {
    throw Error("No access token retrieved!");
  }
  const payload: AuthPayload = parseJwt(IdToken ?? AccessToken);
  const sub = payload?.sub;
  const groups = payload["cognito:groups"] ?? [];
  if (!sub) {
    throw Error("No authentication subject retrieved from ID token!");
  }
  let userRole: UserRole = 'USER';
  if (groups.includes("administrators")) {
    userRole = 'ADMIN';
  }
  else if (groups.includes("support")) {
    userRole = 'SUPPORT';
  }
  return {
    user: { id: sub, email: payload.email ?? email, userRole },
    session: {accessToken: AccessToken},
  }
}

export const signUp = async (email: string, password: string) => {
  const params: SignUpCommandInput = {
    ClientId: config.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Sign up success: ", response);
    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
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
    console.log("User confirmed successfully");
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};
