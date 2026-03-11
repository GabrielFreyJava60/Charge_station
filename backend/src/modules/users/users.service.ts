import { env } from '../../config/env';
import { AwsLambdaInvoker, type LambdaInvoker } from '../../utils/lambdaInvoker';
import { createLogger } from '../../utils/logger';

const logger = createLogger('users.service');
const LAMBDA_INVOKER: LambdaInvoker = new AwsLambdaInvoker(env.awsRegion);

export interface UpdateProfilePayload {
  email?: string;
  address?: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UsersService {
  getMyInfo(userId: string): Promise<UserInfo>;
  updateOwnProfile(userId: string, payload: UpdateProfilePayload): Promise<void>;
  updateUserProfileAsAdmin(adminId: string, userId: string, payload: UpdateProfilePayload): Promise<void>;
  updateUserRole(adminId: string, userId: string, role: string): Promise<void>;
  deleteUser(adminId: string, userId: string): Promise<void>;
}

export class LambdaUsersService implements UsersService {
  async getMyInfo(userId: string): Promise<UserInfo> {
    logger.debug('Invoking userInfo lambda: getMyInfo', { userId });
    const result = await LAMBDA_INVOKER.invokeJson<UserInfo | { error?: string }>(
      env.userInfoLambdaFunctionName,
      {
        user_id: userId
      }
    );

    if (result && 'error' in result) {
      throw new Error(`userInfo lambda error: ${result.error}`);
    }

    return result as UserInfo;
  }

  async updateOwnProfile(userId: string, payload: UpdateProfilePayload): Promise<void> {
    logger.debug('Invoking userManagement lambda: updateOwnProfile', { userId });
    await LAMBDA_INVOKER.invokeJson(env.userManagementLambdaFunctionName, {
      action: 'updateOwnProfile',
      userId,
      payload
    });
  }

  async updateUserProfileAsAdmin(adminId: string, userId: string, payload: UpdateProfilePayload): Promise<void> {
    logger.debug('Invoking userManagement lambda: updateUserProfileAsAdmin', { adminId, userId });
    await LAMBDA_INVOKER.invokeJson(env.userManagementLambdaFunctionName, {
      action: 'updateUserProfileAsAdmin',
      adminId,
      userId,
      payload
    });
  }

  async updateUserRole(adminId: string, userId: string, role: string): Promise<void> {
    logger.debug('Invoking userManagement lambda: updateUserRole', { adminId, userId, role });
    await LAMBDA_INVOKER.invokeJson(env.userManagementLambdaFunctionName, {
      action: 'updateUserRole',
      adminId,
      userId,
      role
    });
  }

  async deleteUser(adminId: string, userId: string): Promise<void> {
    logger.debug('Invoking userManagement lambda: deleteUser', { adminId, userId });
    await LAMBDA_INVOKER.invokeJson(env.userManagementLambdaFunctionName, {
      action: 'deleteUser',
      adminId,
      userId
    });
  }
}

export function buildUsersService(): UsersService {
  return new LambdaUsersService();
}

