import axiosClient from "./AxiosClient";

export interface LandlordPostStatsDTO {
  maBaiDang: string;
  tieuDe?: string | null;
  trangThai?: string | null;
  gia?: number | null;
  viewCount?: number | null;
  likeCount?: number | null;
  revenue?: number | null;
}

export interface LandlordRevenueDTO {
  maHoaDon: string;
  maBaiDang?: string | null;
  tieuDeBaiDang?: string | null;
  maNguoiThue?: string | null;
  tenNguoiThue?: string | null;
  soTien?: number | null;
  ngayThanhToan?: string | null;
  ngayTao?: string | null;
  noiDungChuyenKhoan?: string | null;
  ghiChu?: string | null;
}

export interface LandlordDashboardDTO {
  totalRevenue?: number | null;
  totalPosts?: number | null;
  activePosts?: number | null;
  rentedPosts?: number | null;
  totalViews?: number | null;
  totalLikes?: number | null;
  posts?: LandlordPostStatsDTO[] | null;
  revenues?: LandlordRevenueDTO[] | null;
}

export const getLandlordDashboard = async (maNguoiDung: string) => {
  const res = await axiosClient.get<LandlordDashboardDTO>(
    `/api/v1/landlord/dashboard/${maNguoiDung}`,
  );

  return res.data;
};
