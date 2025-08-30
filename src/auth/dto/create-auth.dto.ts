export class CreateAuthDto {
  id?: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
  avatar?: string;
  access_token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
