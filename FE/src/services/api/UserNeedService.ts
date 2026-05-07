import axiosClient from "./AxiosClient";
import type { IUserNeedFormValues } from "../types/user-need.types";

export interface NhuCauNguoiDungDTO {
  maNhuCauNguoiDung?: string;
  maNguoiDung: string;
  minPrice: number | null;
  maxPrice: number | null;
  phuong: string | null;
  loaiCanHo: string | null;
  coBanCong: boolean;
  dayDuNoiThat: boolean;
  ganTrungTam: boolean;
  ganBien: boolean;
  ngayTao?: string | null;
}

const toDto = (
  maNguoiDung: string,
  values: IUserNeedFormValues
): NhuCauNguoiDungDTO => ({
  maNguoiDung,
  minPrice: values.minPrice,
  maxPrice: values.maxPrice,
  phuong: values.phuong || null,
  loaiCanHo: values.loaiCanHo || null,
  coBanCong: values.coBanCong,
  dayDuNoiThat: values.dayDuNoiThat,
  ganTrungTam: values.ganTrungTam,
  ganBien: values.ganBien,
});

export const getUserNeeds = async () => {
  const response = await axiosClient.get<NhuCauNguoiDungDTO[]>(
    "/api/v1/nhucaunguoidung"
  );
  return response.data;
};

export const getUserNeedByUserId = async (maNguoiDung: string) => {
  const needs = await getUserNeeds();
  return needs.find((item) => item.maNguoiDung === maNguoiDung) || null;
};

export const createUserNeed = async (
  maNguoiDung: string,
  values: IUserNeedFormValues
) => {
  const response = await axiosClient.post<NhuCauNguoiDungDTO>(
    "/api/v1/nhucaunguoidung",
    toDto(maNguoiDung, values)
  );

  return response.data;
};

export const updateUserNeed = async (
  maNhuCauNguoiDung: string,
  maNguoiDung: string,
  values: IUserNeedFormValues
) => {
  const response = await axiosClient.put<NhuCauNguoiDungDTO>(
    `/api/v1/nhucaunguoidung/${maNhuCauNguoiDung}`,
    toDto(maNguoiDung, values)
  );

  return response.data;
};

export const createOrUpdateUserNeed = async (
  maNguoiDung: string,
  values: IUserNeedFormValues
) => {
  const existing = await getUserNeedByUserId(maNguoiDung);

  if (existing?.maNhuCauNguoiDung) {
    return updateUserNeed(existing.maNhuCauNguoiDung, maNguoiDung, values);
  }

  return createUserNeed(maNguoiDung, values);
};
