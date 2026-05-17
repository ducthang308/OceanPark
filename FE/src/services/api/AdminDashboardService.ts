import axiosClient from './AxiosClient';

export interface ActivityDTO {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface DashboardStatsDTO {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  totalRevenue: number;
  recentActivity?: ActivityDTO[];
}

export const getDashboardStats = async (): Promise<DashboardStatsDTO> => {
  const res = await axiosClient.get<DashboardStatsDTO>('/api/v1/admin/dashboard/stats');
  return res.data;
};
