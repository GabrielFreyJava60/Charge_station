export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT';

export interface User {
  id: string;
  email: string;
  userRole: UserRole;
}

export interface AuthSession {
  accessToken: string;
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

export interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};