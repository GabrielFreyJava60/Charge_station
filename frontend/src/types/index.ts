export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT';

export interface User {
  id: string;
  email: string;
  userRole: UserRole;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  ["cognito:groups"]?: string[];
  sub?: string;
  email?: string;
}

export interface AuthDataType {
  user: User;
  session: AuthSession;
}
