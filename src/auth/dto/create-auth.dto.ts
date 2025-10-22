export class CreateAuthDto {
  id?: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
  avatar?: string;
  city?: string;
  state?: string;
  phone?: string;
  type_login?: string;
  first_access?: boolean;
  verify_email?: boolean;
  verify_token?: string;
  access_token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
