import axiosClient from "./AxiosClient";

export interface ViNguoiChoThueDTO {
  maVi: string;
  maNguoiDung: string;
  tenNguoiDung?: string | null;
  soDuKhaDung?: number | null;
  soDuChoRut?: number | null;
  tongDoanhThu?: number | null;
}

export interface GiaoDichViDTO {
  maGiaoDichVi: string;
  maVi: string;
  maHoaDon?: string | null;
  loaiGiaoDich?: string | null;
  soTien?: number | null;
  noiDung?: string | null;
  ngayTao?: string | null;
}

export interface YeuCauRutTienDTO {
  maYeuCauRutTien: string;
  maVi: string;
  maNguoiDung?: string | null;
  tenNguoiDung?: string | null;
  emailNguoiDung?: string | null;
  soDienThoaiNguoiDung?: string | null;
  bankCode?: string | null;
  bankAccount?: string | null;
  accountName?: string | null;
  soTien?: number | null;
  trangThai?: string | null;
  ngayTao?: string | null;
  ngayXuLy?: string | null;
}

export interface CreateWithdrawRequest {
  maNguoiDung: string;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  soTien: number;
}

export const getLandlordWallet = async (maNguoiDung: string) => {
  const res = await axiosClient.get<ViNguoiChoThueDTO>(
    `/api/v1/vi-nguoi-cho-thue/${maNguoiDung}`,
  );
  return res.data;
};

export const getWalletTransactions = async (maNguoiDung: string) => {
  const res = await axiosClient.get<GiaoDichViDTO[]>(
    `/api/v1/vi-nguoi-cho-thue/${maNguoiDung}/giao-dich`,
  );
  return res.data;
};

export const getWithdrawRequestsByLandlord = async (maNguoiDung: string) => {
  const res = await axiosClient.get<YeuCauRutTienDTO[]>(
    `/api/v1/vi-nguoi-cho-thue/${maNguoiDung}/rut-tien`,
  );
  return res.data;
};

export const createWithdrawRequest = async (payload: CreateWithdrawRequest) => {
  const res = await axiosClient.post<YeuCauRutTienDTO>(
    "/api/v1/vi-nguoi-cho-thue/rut-tien",
    payload,
  );
  return res.data;
};

export const getAllWithdrawRequests = async () => {
  const res = await axiosClient.get<YeuCauRutTienDTO[]>(
    "/api/v1/vi-nguoi-cho-thue/rut-tien",
  );
  return res.data;
};

export const approveWithdrawRequest = async (maYeuCauRutTien: string) => {
  const res = await axiosClient.put<YeuCauRutTienDTO>(
    `/api/v1/vi-nguoi-cho-thue/rut-tien/${maYeuCauRutTien}/approve`,
  );
  return res.data;
};

export const rejectWithdrawRequest = async (maYeuCauRutTien: string) => {
  const res = await axiosClient.put<YeuCauRutTienDTO>(
    `/api/v1/vi-nguoi-cho-thue/rut-tien/${maYeuCauRutTien}/reject`,
  );
  return res.data;
};
