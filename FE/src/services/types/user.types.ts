
export interface IUserResponse {
  id: number;
  full_name: string;
  phone_number: string;
  password: string;
  address: string;
  status: boolean;
  roles_id: number;
}

export interface IUser {
  id: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  status: boolean;
  rolesId: number;
}