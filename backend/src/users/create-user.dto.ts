export interface CreateUserDto {
  user_name: string;
  password: string;
  rol?: string | null;
  application?: string | null;
}