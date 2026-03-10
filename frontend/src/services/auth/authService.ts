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

const logger = getLogger("authService");

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.cognitoRegion,
});

function checkAuthResult(authResult: AuthenticationResultType | undefined): AuthenticationResultType {
  if (!authResult) {
    throw Error("No Authentication result received!");
  }
  logger.debug(`Token type: ${authResult.TokenType}`);
  logger.debug(`accessToken: ${authResult.AccessToken}`);
  if (authResult.TokenType !== "Bearer") {
    throw Error("Wrong token type!");
  }
  if (!authResult.AccessToken) {
    throw Error("No access token received!");
  }

  return authResult;
}

export const signIn = async (email: string, password: string) => {
  const params: InitiateAuthCommandInput = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.cognitoClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };
  const command = new InitiateAuthCommand(params);
  const output: InitiateAuthCommandOutput = await cognitoClient.send(command);
  logger.debug("output: ", output);
  const rawResult = output.AuthenticationResult;
  const authenticationResult = checkAuthResult(rawResult);
  logger.debug("Authentication successful");
    
  return authenticationResult;
};

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
