import axiosClient from './AxiosClient';
import { getPosts, type BaiDangDTO } from './PostManagementService';

const mergePostsById = (posts: BaiDangDTO[]) => {
  const result = new Map<string, BaiDangDTO>();

  posts.forEach((post) => {
    if (post.maBaiDang) {
      result.set(post.maBaiDang, post);
    }
  });

  return Array.from(result.values());
};

export const getAdminPosts = async (): Promise<BaiDangDTO[]> => {
  const [visibleResult, pendingResult] = await Promise.allSettled([
    getPosts(),
    axiosClient.get<BaiDangDTO[]>('/api/v1/admin/dashboard/pending-posts', {
      params: { limit: 1000 },
    }),
  ]);

  const visiblePosts = visibleResult.status === 'fulfilled' ? visibleResult.value : [];
  const pendingPosts = pendingResult.status === 'fulfilled' ? pendingResult.value.data : [];

  if (visibleResult.status === 'rejected' && pendingResult.status === 'rejected') {
    throw visibleResult.reason;
  }

  return mergePostsById([...pendingPosts, ...visiblePosts]);
};

export const approvePost = async (maBaiDang: string): Promise<BaiDangDTO> => {
  const res = await axiosClient.put<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}/approve`);
  return res.data;
};

export const rejectPost = async (maBaiDang: string, reason?: string): Promise<BaiDangDTO> => {
  const res = reason
    ? await axiosClient.put<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}/reject`, { reason })
    : await axiosClient.put<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}/reject`);

  return res.data;
};
