import axiosClient from './AxiosClient';

export interface ActivityDTO {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface MonthlyDashboardPointDTO {
  label: string;
  approvedPosts: number;
  pendingPosts: number;
  confirmedPayments: number;
  revenue: number;
}

export interface DashboardQueueItemDTO {
  id: string;
  type: 'post' | 'payment' | string;
  title: string;
  meta: string;
  status: string;
  createdAt: string;
}

export interface DashboardStatsDTO {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  approvedPosts?: number;
  rejectedPosts?: number;
  pendingPayments?: number;
  confirmedPayments?: number;
  totalRevenue: number;
  monthRevenue?: number;
  monthlyStats?: MonthlyDashboardPointDTO[];
  queueItems?: DashboardQueueItemDTO[];
  recentActivity?: ActivityDTO[];
}

export const getDashboardStats = async (): Promise<DashboardStatsDTO> => {
  const res = await axiosClient.get<DashboardStatsDTO>('/api/v1/admin/dashboard/stats');
  return res.data;
};
