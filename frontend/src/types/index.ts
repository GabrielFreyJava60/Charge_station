export interface User {
  id: string;
  email: string;
  user_role: 'USER' | 'ADMIN' | 'SUPPORT';
}
