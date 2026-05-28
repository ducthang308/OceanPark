import { formatCurrency } from "./currency";
import { formatDate } from "./date";
import { openInvoicePrintWindow } from "./invoicePrint";
import type { InvoicePrintRow } from "./invoicePrint";
import type { YeuCauRutTienDTO } from "../services/api/WalletService";

export const normalizeWithdrawStatus = (status?: string | null) =>
  status?.trim().toUpperCase() || "";

export const isWithdrawPrintable = (request: YeuCauRutTienDTO) =>
  normalizeWithdrawStatus(request.trangThai) === "SUCCESS";

export const getWithdrawStatusLabel = (status?: string | null) => {
  switch (normalizeWithdrawStatus(status)) {
    case "PENDING":
      return "Chờ xử lý";
    case "SUCCESS":
      return "Thành công";
    case "REJECTED":
      return "Đã từ chối";
    default:
      return status || "-";
  }
};

export const openWithdrawPrintWindow = (
  request: YeuCauRutTienDTO,
  signerLabel: string,
) => {
  const rows: InvoicePrintRow[] = [
    ["Mã yêu cầu", request.maYeuCauRutTien],
    ["Mã ví", request.maVi || "-"],
    ["Người cho thuê", request.tenNguoiDung || request.maNguoiDung || "-"],
    ["Email", request.emailNguoiDung || "-"],
    ["Số điện thoại", request.soDienThoaiNguoiDung || "-"],
    ["Ngân hàng", request.bankCode || "-"],
    ["Số tài khoản", request.bankAccount || "-"],
    ["Chủ tài khoản", request.accountName || "-"],
    ["Số tiền", formatCurrency(request.soTien || 0)],
    ["Trạng thái", getWithdrawStatusLabel(request.trangThai)],
    ["Ngày tạo", formatDate(request.ngayTao || undefined)],
    ["Ngày xử lý", formatDate(request.ngayXuLy || undefined)],
  ];

  return openInvoicePrintWindow({
    title: "Phiếu rút tiền",
    documentTitle: `Phiếu rút tiền ${request.maYeuCauRutTien}`,
    generatedAt: formatDate(new Date()),
    rows,
    footer: "Phiếu rút tiền chỉ có giá trị khi yêu cầu đã được admin xác nhận chuyển khoản thành công.",
    signerLabel,
    printButtonLabel: "In phiếu rút tiền",
  });
};
