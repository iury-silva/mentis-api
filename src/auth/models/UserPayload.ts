export interface UserPayload {
  sub: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  city?: string;
  state?: string;
  phone?: string;
  type_login?: string;
  first_access?: boolean;
  verify_email?: boolean;
  verify_token?: string;
  iat?: number;
  exp?: number;
}
