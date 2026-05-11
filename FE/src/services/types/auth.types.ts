export interface LoginResponse {
  token: string;
  maNguoiDung: string;
  hoVaTen: string;
  soDienThoai: string;
  email: string;
  maVaiTro?: string;
  vaiTro: string;
}

export interface ILoginRequest {
  soDienThoai: string;
  matKhau: string;
}

export interface IRegisterRequest {
  hoVaTen: string;
  email: string;
  soDienThoai: string;
  matKhau: string;
  maVaiTro: string;
}
