import axiosClient from './AxiosClient';

export type PaymentAccountDTO = {
  maTaiKhoan: string;
  maNguoiDung: string;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  isDefault?: boolean;
  trangThai?: string;
};

export type UpsertDefaultPaymentAccountPayload = {
  bankCode: string;
  bankAccount: string;
  accountName: string;
};

/**
 * Lấy danh sách tài khoản nhận tiền của người cho thuê.
 * Theo spec: mỗi landlord chỉ có 1 tài khoản default active.
 */
export const getPaymentAccountsByLandlord = async (maNguoiDung: string) => {
  const res = await axiosClient.get<PaymentAccountDTO[]>(
    `/api/v1/vi-nguoi-cho-thue/${maNguoiDung}/payment-accounts`,
  );
  return res.data;
};

/**
 * Tạo hoặc cập nhật tài khoản nhận tiền mặc định (isDefault=true, trangThai=ACTIVE).
 */
export const upsertDefaultPaymentAccount = async (
  maNguoiDung: string,
  payload: UpsertDefaultPaymentAccountPayload,
) => {
  const res = await axiosClient.put<PaymentAccountDTO>(
    `/api/v1/vi-nguoi-cho-thue/${maNguoiDung}/payment-accounts/default`,
    payload,
  );
  return res.data;
};

