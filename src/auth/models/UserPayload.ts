export interface UserPayload {
  sub: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  iat?: number;
  exp?: number;
}
