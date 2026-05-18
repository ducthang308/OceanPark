export interface IUserNeed {
  id?: number;
  idNguoiDung: number;
  minPrice: number | null;
  maxPrice: number | null;
  phuong: string | null;
  loaiCanHo: string | null;
  coBanCong: boolean;
  dayDuNoiThat: boolean;
  coMayLanh: boolean;
  coThangMay: boolean;
  coBaoVe24h: boolean;
  coMayGiat: boolean;
  khongChungChu: boolean;
  coHamXe: boolean;
  coKeBep: boolean;
  coTuLanh: boolean;
  gioGiacTuDo: boolean;
  ganTrungTam: boolean;
  ganBien: boolean;
  ngayTao?: string | null;
}

export interface IUserNeedFormValues {
  minPrice: number | null;
  maxPrice: number | null;
  phuong: string;
  loaiCanHo: string;
  coBanCong: boolean;
  dayDuNoiThat: boolean;
  coMayLanh: boolean;
  coThangMay: boolean;
  coBaoVe24h: boolean;
  coMayGiat: boolean;
  khongChungChu: boolean;
  coHamXe: boolean;
  coKeBep: boolean;
  coTuLanh: boolean;
  gioGiacTuDo: boolean;
  ganTrungTam: boolean;
  ganBien: boolean;
}
