export interface LoginResponse {
  token: string;
  id: number;
  phone_number: string;
  roles_id: number;
  address: string;
  full_name: string;
  status: boolean;
}

export interface ILoginRequest {
  phone_number: string;
  password: string;
}

export interface IRegisterRequest {
  full_name: string;
  phone_number: string;
  password: string;
  retype_pass: string;
  roles_id: number;
}