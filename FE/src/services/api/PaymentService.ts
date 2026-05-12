import axiosClient from "./AxiosClient";

export type ActivationDuration = 5 | 10 | 15 | 30;

export type ActivationPlan = {
  id: string;
  name: string;
  shortName: string;
  stars: number;
  tone: "red" | "pink" | "orange" | "blue" | "navy";
  titleStyle: string;
  sizeLabel: string;
  pushPrice: number;
  autoApprove: boolean;
  keepNormalPost: boolean;
  callButton: boolean;
  prices: Record<ActivationDuration, number>;
};

export interface SepayCreatePaymentPayload {
  maNguoiDung: string;
  maBaiDang: string;
  loaiHoaDon: "DANG_BAI" | "THUE_CAN_HO";
  soTien: number;
  ghiChu?: string;
}

export interface SepayCreatePaymentResponse {
  maHoaDon: string;
  noiDungChuyenKhoan: string;
  soTien: number;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  qrUrl: string;
}

export interface HoaDonDTO {
  maHoaDon: string;
  maNguoiDung?: string | null;
  maBaiDang?: string | null;
  loaiHoaDon?: string | null;
  soTien?: number | null;
  trangThaiThanhToan?: string | null;
  trangThaiHieuLuc?: string | null;
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  noiDungChuyenKhoan?: string | null;
  ghiChu?: string | null;
  ngayTao?: string | null;
  ngayThanhToan?: string | null;
}

export const ACTIVATION_DURATIONS: ActivationDuration[] = [5, 10, 15, 30];

export const POST_ACTIVATION_PLANS: ActivationPlan[] = [
  {
    id: "vip-noi-bat",
    name: "Tin VIP Nổi Bật",
    shortName: "VIP Nổi Bật",
    stars: 5,
    tone: "red",
    titleStyle: "Màu đỏ, in hoa",
    sizeLabel: "Rất lớn",
    pushPrice: 5400,
    autoApprove: true,
    keepNormalPost: true,
    callButton: true,
    prices: {
      5: 351000,
      10: 702000,
      15: 1053000,
      30: 1684800,
    },
  },
  {
    id: "vip-1",
    name: "Tin VIP 1",
    shortName: "VIP 1",
    stars: 4,
    tone: "pink",
    titleStyle: "Màu hồng, in hoa",
    sizeLabel: "Lớn",
    pushPrice: 3240,
    autoApprove: true,
    keepNormalPost: true,
    callButton: true,
    prices: {
      5: 210600,
      10: 421200,
      15: 631800,
      30: 1010880,
    },
  },
  {
    id: "vip-2",
    name: "Tin VIP 2",
    shortName: "VIP 2",
    stars: 3,
    tone: "orange",
    titleStyle: "Màu cam, in hoa",
    sizeLabel: "Trung bình",
    pushPrice: 2160,
    autoApprove: true,
    keepNormalPost: false,
    callButton: true,
    prices: {
      5: 140400,
      10: 280800,
      15: 421200,
      30: 673920,
    },
  },
  {
    id: "vip-3",
    name: "Tin VIP 3",
    shortName: "VIP 3",
    stars: 2,
    tone: "blue",
    titleStyle: "Màu xanh, in hoa",
    sizeLabel: "Trung bình",
    pushPrice: 2160,
    autoApprove: true,
    keepNormalPost: false,
    callButton: true,
    prices: {
      5: 70200,
      10: 140400,
      15: 210600,
      30: 336960,
    },
  },
  {
    id: "tin-thuong",
    name: "Tin thường",
    shortName: "Thường",
    stars: 0,
    tone: "navy",
    titleStyle: "Màu mặc định, viết thường",
    sizeLabel: "Nhỏ",
    pushPrice: 2160,
    autoApprove: false,
    keepNormalPost: false,
    callButton: false,
    prices: {
      5: 12420,
      10: 24840,
      15: 37260,
      30: 59400,
    },
  },
];

export const formatPaymentMoney = (value?: number | null) =>
  `${new Intl.NumberFormat("vi-VN").format(value || 0)}đ`;

export const getActivationPlanPrice = (
  plan: ActivationPlan,
  duration: ActivationDuration,
  vatIncluded = true
) => {
  const price = plan.prices[duration];
  return vatIncluded ? price : Math.round(price / 1.08);
};

export const createSepayPayment = async (payload: SepayCreatePaymentPayload) => {
  const res = await axiosClient.post<SepayCreatePaymentResponse>(
    "/api/v1/sepay/create-payment",
    payload
  );
  return res.data;
};

export const getInvoicesByUser = async (maNguoiDung: string) => {
  const res = await axiosClient.get<HoaDonDTO[]>(
    `/api/v1/hoa-don/nguoi-dung/${maNguoiDung}`
  );
  return res.data;
};

export const getInvoiceById = async (maHoaDon: string) => {
  const res = await axiosClient.get<HoaDonDTO>(`/api/v1/hoa-don/${maHoaDon}`);
  return res.data;
};
