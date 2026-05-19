import axiosClient from './AxiosClient';
import type { BaiDangDTO } from './PostManagementService';

export type DashboardChartType = 'day' | 'month' | 'year';

export interface DashboardStatsDTO {
  totalRevenue: number;
  totalUsers: number;
  totalRenters: number;
  totalLandlords: number;
  totalAdmins: number;
  totalPosts: number;
  activePosts: number;
  rentedPosts: number;
  pendingPosts?: number;
  pendingPayments?: number;
}

export interface DashboardChartSeriesDTO {
  name: string;
  values: number[];
}

export interface DashboardChartDTO {
  labels: string[];
  values: number[];
  series?: DashboardChartSeriesDTO[];
}

export const getDashboardOverview = async (): Promise<DashboardStatsDTO> => {
  const res = await axiosClient.get<DashboardStatsDTO>('/api/v1/admin/dashboard/overview');
  return res.data;
};

export const getRevenueChart = async (
  type: DashboardChartType,
): Promise<DashboardChartDTO> => {
  const res = await axiosClient.get<DashboardChartDTO>('/api/v1/admin/dashboard/revenue-chart', {
    params: { type },
  });
  return res.data;
};

export const getPostChart = async (
  type: DashboardChartType,
): Promise<DashboardChartDTO> => {
  const res = await axiosClient.get<DashboardChartDTO>('/api/v1/admin/dashboard/post-chart', {
    params: { type },
  });
  return res.data;
};

export const getUserChart = async (): Promise<DashboardChartDTO> => {
  const res = await axiosClient.get<DashboardChartDTO>('/api/v1/admin/dashboard/user-chart');
  return res.data;
};

export const getPendingPosts = async (limit = 6): Promise<BaiDangDTO[]> => {
  const res = await axiosClient.get<BaiDangDTO[]>('/api/v1/admin/dashboard/pending-posts', {
    params: { limit },
  });
  return res.data;
};

export const getDashboardStats = getDashboardOverview;
