import axiosClient from './AxiosClient';
import type { BaiDangDTO } from './PostManagementService';

export const getAdminPosts = async (): Promise<BaiDangDTO[]> => {
  const res = await axiosClient.get<BaiDangDTO[]>('/api/v1/bai-dang');
  return res.data;
};

export const approvePost = async (maBaiDang: string): Promise<BaiDangDTO> => {
  const res = await axiosClient.put<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}/approve`);
  return res.data;
};

export const rejectPost = async (maBaiDang: string, reason?: string): Promise<BaiDangDTO> => {
  const res = await axiosClient.put<BaiDangDTO>(
    `/api/v1/bai-dang/${maBaiDang}/reject`,
    reason ? { reason } : {},
  );
  return res.data;
};
