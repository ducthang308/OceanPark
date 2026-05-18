import axiosClient from './AxiosClient';

export interface HoaDonDTO {
  maHoaDon: string;
  maNguoiDung?: string | null;
  maBaiDang?: string | null;
  maGoiDangBai?: string | null;
  loaiHoaDon: string;
  soTien: number;
  trangThaiThanhToan: string; // e.g. "CHUA_THANH_TOAN", "DA_THANH_TOAN", "CHO_XAC_NHAN", "THAT_BAI", "HOAN_TIEN"
  trangThaiHieuLuc?: string | null;
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  noiDungChuyenKhoan?: string | null;
  ghiChu?: string | null;
  ngayTao: string;
  ngayThanhToan?: string | null;
}

export const getAllInvoices = async (): Promise<HoaDonDTO[]> => {
  const res = await axiosClient.get<HoaDonDTO[]>('/api/v1/hoa-don');
  return res.data;
};

export const getInvoiceById = async (maHoaDon: string): Promise<HoaDonDTO> => {
  const res = await axiosClient.get<HoaDonDTO>(`/api/v1/hoa-don/${maHoaDon}`);
  return res.data;
};
