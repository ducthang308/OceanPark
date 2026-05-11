export interface LoginResponse {
  token: string;
  maNguoiDung: string;
  hoVaTen: string;
  soDienThoai: string;
  email: string;
  maVaiTro?: string;
  vaiTro: string;
}

export interface AuthUserResponse {
  maNguoiDung: string;
  hoVaTen: string;
  soDienThoai: string;
  email: string | null;
  maVaiTro?: string | null;
  vaiTro?: string | null;
  anhDaiDien?: string | null;
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
