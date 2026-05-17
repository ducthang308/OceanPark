import axiosClient from './AxiosClient';

export interface AdminUserDTO {
  maNguoiDung?: string;
  maVaiTro?: string | null;
  hoVaTen: string;
  email?: string | null;
  diaChi?: string | null;
  soDienThoai: string;
  trangThai?: boolean | null;
  matKhau?: string;
  anhDaiDien?: string | null;
}

export const getAllUsers = async (): Promise<AdminUserDTO[]> => {
  const res = await axiosClient.get<AdminUserDTO[]>('/api/v1/nguoi-dung');
  return res.data;
};

export const createUserByAdmin = async (payload: AdminUserDTO): Promise<AdminUserDTO> => {
  const res = await axiosClient.post<AdminUserDTO>('/api/v1/nguoi-dung', payload);
  return res.data;
};

export const updateUserByAdmin = async (
  maNguoiDung: string,
  payload: Partial<AdminUserDTO>,
): Promise<AdminUserDTO> => {
  const res = await axiosClient.put<AdminUserDTO>(`/api/v1/nguoi-dung/${maNguoiDung}`, payload);
  return res.data;
};

export const changeUserStatus = async (
  maNguoiDung: string,
  trangThai: boolean,
): Promise<AdminUserDTO> => updateUserByAdmin(maNguoiDung, { trangThai });

export const deleteUserByAdmin = async (maNguoiDung: string): Promise<void> => {
  await axiosClient.delete(`/api/v1/nguoi-dung/${maNguoiDung}`);
};
