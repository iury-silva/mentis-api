export interface UserPayload {
  sub: string;
  name: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}
