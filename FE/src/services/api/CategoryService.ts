import axiosClient from './AxiosClient';

export interface DanhMucDTO {
  maDanhMuc?: string;
  tenDanhMuc: string;
}

export const getCategories = async (): Promise<DanhMucDTO[]> => {
  const res = await axiosClient.get<DanhMucDTO[]>('/api/v1/danhmuc');
  return res.data;
};

export const createCategory = async (payload: DanhMucDTO): Promise<DanhMucDTO> => {
  const res = await axiosClient.post<DanhMucDTO>('/api/v1/danhmuc', payload);
  return res.data;
};

export const updateCategory = async (
  maDanhMuc: string,
  payload: DanhMucDTO,
): Promise<DanhMucDTO> => {
  const res = await axiosClient.put<DanhMucDTO>(`/api/v1/danhmuc/${maDanhMuc}`, payload);
  return res.data;
};

export const deleteCategory = async (maDanhMuc: string): Promise<void> => {
  await axiosClient.delete(`/api/v1/danhmuc/${maDanhMuc}`);
};
