const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminListGroupsForUserCommand,
  ListUsersCommand,
  AdminRemoveUserFromGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

const cognitoClient = new CognitoIdentityProviderClient({ region: config.aws.region });

async function signUp(email, password, name, phoneNumber) {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'name', Value: name },
  ];
  if (phoneNumber) {
    userAttributes.push({ Name: 'phone_number', Value: phoneNumber });
  }

  if (config.isDev && !config.cognito.userPoolId) {
    return _devSignUp(email, name);
  }

  const command = new SignUpCommand({
    ClientId: config.cognito.clientId,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  });

  const result = await cognitoClient.send(command);

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
    GroupName: 'USER',
  }));

  return {
    userId: result.UserSub,
    email,
    name,
    confirmed: result.UserConfirmed,
  };
}

async function signIn(email, password) {
  if (config.isDev && !config.cognito.userPoolId) {
    return _devSignIn(email, password);
  }

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.cognito.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = await cognitoClient.send(command);
  const auth = result.AuthenticationResult;
  if (!auth) {
    throw new UnauthorizedError('Authentication failed');
  }

  const decoded = jwt.decode(auth.IdToken);
  return {
    accessToken: auth.AccessToken,
    idToken: auth.IdToken,
    refreshToken: auth.RefreshToken,
    expiresIn: auth.ExpiresIn,
    userId: decoded.sub,
    email: decoded.email,
    role: (decoded['cognito:groups'] || [])[0] || 'USER',
  };
}

async function refreshToken(refreshTokenValue) {
  if (config.isDev && !config.cognito.userPoolId) {
    throw new ValidationError('Token refresh not available in dev mode without Cognito');
  }

  const command = new InitiateAuthCommand({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: config.cognito.clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshTokenValue,
    },
  });

  const result = await cognitoClient.send(command);
  const auth = result.AuthenticationResult;
  return {
    accessToken: auth.AccessToken,
    idToken: auth.IdToken,
    expiresIn: auth.ExpiresIn,
  };
}

async function changeUserRole(email, newRole) {
  if (config.isDev && !config.cognito.userPoolId) {
    return { email, role: newRole };
  }

  const groups = await cognitoClient.send(new AdminListGroupsForUserCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
  }));

  for (const group of (groups.Groups || [])) {
    await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
      UserPoolId: config.cognito.userPoolId,
      Username: email,
      GroupName: group.GroupName,
    }));
  }

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
    GroupName: newRole,
  }));

  return { email, role: newRole };
}

async function disableUser(email) {
  if (config.isDev && !config.cognito.userPoolId) return;
  await cognitoClient.send(new AdminDisableUserCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
  }));
}

async function enableUser(email) {
  if (config.isDev && !config.cognito.userPoolId) return;
  await cognitoClient.send(new AdminEnableUserCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
  }));
}

async function deleteUser(email) {
  if (config.isDev && !config.cognito.userPoolId) return;
  await cognitoClient.send(new AdminDeleteUserCommand({
    UserPoolId: config.cognito.userPoolId,
    Username: email,
  }));
}

async function listUsers() {
  if (config.isDev && !config.cognito.userPoolId) {
    return [];
  }
  const result = await cognitoClient.send(new ListUsersCommand({
    UserPoolId: config.cognito.userPoolId,
  }));
  return (result.Users || []).map(u => {
    const attrs = {};
    (u.Attributes || []).forEach(a => { attrs[a.Name] = a.Value; });
    return {
      userId: attrs.sub,
      email: attrs.email,
      name: attrs.name,
      status: u.UserStatus,
      enabled: u.Enabled,
      createdAt: u.UserCreateDate?.toISOString(),
    };
  });
}

function _devSignUp(email, name) {
  const userId = `dev-${Date.now()}`;
  return {
    userId,
    email,
    name,
    confirmed: true,
  };
}

function _devSignIn(email, _password) {
  const userId = `dev-${email.split('@')[0]}`;
  const role = email.includes('admin') ? 'ADMIN'
    : email.includes('tech') ? 'TECH_SUPPORT'
      : 'USER';

  const token = jwt.sign(
    { sub: userId, email, role, groups: [role] },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '1h' },
  );

  return {
    accessToken: token,
    idToken: token,
    refreshToken: 'dev-refresh-token',
    expiresIn: 3600,
    userId,
    email,
    role,
  };
}

module.exports = {
  signUp,
  signIn,
  refreshToken,
  changeUserRole,
  disableUser,
  enableUser,
  deleteUser,
  listUsers,
};
