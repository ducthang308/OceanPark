import axiosClient from './AxiosClient';

export interface GoiDangBaiDTO {
  maGoiDangBai?: string;
  maNguoiDung?: string | null;
  hoVaTenNguoiDung?: string | null;
  tenGoi: string;
  giaTien: number;
  thoiHanNgay?: number | null;
  trangThai?: string | null;
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  ngayTao?: string | null;
}

export const getPackages = async (): Promise<GoiDangBaiDTO[]> => {
  const res = await axiosClient.get<GoiDangBaiDTO[]>('/api/v1/goi-dang-bai');
  return res.data;
};

export const createPackage = async (payload: GoiDangBaiDTO): Promise<GoiDangBaiDTO> => {
  const res = await axiosClient.post<GoiDangBaiDTO>('/api/v1/goi-dang-bai', payload);
  return res.data;
};

export const updatePackage = async (
  maGoiDangBai: string,
  payload: GoiDangBaiDTO,
): Promise<GoiDangBaiDTO> => {
  const res = await axiosClient.put<GoiDangBaiDTO>(
    `/api/v1/goi-dang-bai/${maGoiDangBai}`,
    payload,
  );
  return res.data;
};

export const deletePackage = async (maGoiDangBai: string): Promise<void> => {
  await axiosClient.delete(`/api/v1/goi-dang-bai/${maGoiDangBai}`);
};
