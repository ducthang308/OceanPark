import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import './TenantTransactionsPage.css';
import Navbar from '../../components/layout/Navbar/navbar';
import {
  getHoaDonById,
  getHoaDonByNguoiDung,
  type HoaDonDTO,
} from '../../services/api/PostManagementService';

type TransactionRow = {
  id: string;
  invoiceId: string;
  typeLabel: string;
  amountText: string;
  createdAtText: string;
  paidAtText: string;
  paymentStatusLabel: string;
  transferCode: string;
  invoice: HoaDonDTO;
};

const normalizeStatus = (value?: string | null) => value?.trim().toUpperCase() ?? '';

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0 đ';
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getInvoiceTypeLabel = (type?: string | null) => {
  switch (normalizeStatus(type)) {
    case 'THUE_CAN_HO':
      return 'Thanh toán thuê căn hộ';
    case 'DANG_BAI':
      return 'Mua gói đăng bài';
    default:
      return type || '-';
  }
};

const getPaymentStatusLabel = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case 'SUCCESS':
      return 'Thành công';
    case 'PENDING':
      return 'Chờ thanh toán';
    case 'FAILED':
      return 'Thất bại';
    default:
      return status || '-';
  }
};

const getPaymentStatusTone = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case 'SUCCESS':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const getEffectiveStatusLabel = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case 'DANG_HIEU_LUC':
      return 'Đang hiệu lực';
    case 'HET_HIEU_LUC':
      return 'Hết hiệu lực';
    default:
      return status || '-';
  }
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object' && 'message' in data) {
      const messageValue = (data as { message?: unknown }).message;
      if (typeof messageValue === 'string' && messageValue.trim()) return messageValue;
    }
  }

  return fallback;
};

const sortInvoicesByLatest = (items: HoaDonDTO[]) =>
  [...items].sort((a, b) => {
    const left = new Date(a.ngayThanhToan || a.ngayTao || 0).getTime();
    const right = new Date(b.ngayThanhToan || b.ngayTao || 0).getTime();

    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const TenantTransactionsPage = () => {
  const [invoices, setInvoices] = useState<HoaDonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<HoaDonDTO | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);

  const rows = useMemo<TransactionRow[]>(
    () =>
      invoices.map((invoice) => ({
        id: invoice.maHoaDon,
        invoiceId: invoice.maHoaDon,
        typeLabel: getInvoiceTypeLabel(invoice.loaiHoaDon),
        amountText: formatCurrency(invoice.soTien),
        createdAtText: formatDateTime(invoice.ngayTao),
        paidAtText: formatDateTime(invoice.ngayThanhToan),
        paymentStatusLabel: getPaymentStatusLabel(invoice.trangThaiThanhToan),
        transferCode: invoice.noiDungChuyenKhoan || invoice.maHoaDon,
        invoice,
      })),
    [invoices],
  );

  const loadTransactions = useCallback(async () => {
    const maNguoiDung = localStorage.getItem('userId');

    if (!maNguoiDung) {
      setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      setInvoices([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getHoaDonByNguoiDung(maNguoiDung);
      const rentalInvoices = data.filter(
        (invoice) => normalizeStatus(invoice.loaiHoaDon) === 'THUE_CAN_HO',
      );

      setInvoices(sortInvoicesByLatest(rentalInvoices));
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(
        requestError,
        'Không tải được danh sách giao dịch',
      );
      setInvoices([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleOpenInvoiceDetail = async (invoice: HoaDonDTO) => {
    setSelectedInvoice(invoice);
    setInvoiceDetailLoading(true);

    try {
      const detail = await getHoaDonById(invoice.maHoaDon);
      setSelectedInvoice(detail);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không tải được chi tiết hóa đơn'));
    } finally {
      setInvoiceDetailLoading(false);
    }
  };

  const handleExportInvoice = (invoice: HoaDonDTO) => {
    const invoiceRows = [
      ['Mã hóa đơn', invoice.maHoaDon],
      ['Người dùng', invoice.maNguoiDung || '-'],
      ['Bài đăng', invoice.maBaiDang || '-'],
      ['Loại giao dịch', getInvoiceTypeLabel(invoice.loaiHoaDon)],
      ['Số tiền', formatCurrency(invoice.soTien)],
      ['Trạng thái thanh toán', getPaymentStatusLabel(invoice.trangThaiThanhToan)],
      ['Trạng thái hiệu lực', getEffectiveStatusLabel(invoice.trangThaiHieuLuc)],
      ['Mã chuyển khoản', invoice.noiDungChuyenKhoan || '-'],
      ['Ghi chú', invoice.ghiChu || '-'],
      ['Ngày tạo', formatDateTime(invoice.ngayTao)],
      ['Ngày thanh toán', formatDateTime(invoice.ngayThanhToan)],
      ['Ngày bắt đầu', formatDateTime(invoice.ngayBatDau)],
      ['Ngày kết thúc', formatDateTime(invoice.ngayKetThuc)],
    ];
    const rowsHtml = invoiceRows
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
      )
      .join('');
    const printWindow = window.open('', '_blank', 'width=900,height=720');

    if (!printWindow) {
      message.error('Trình duyệt đang chặn cửa sổ xuất hóa đơn');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hoa don ${escapeHtml(invoice.maHoaDon)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 40px; }
            .invoice { max-width: 760px; margin: 0 auto; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            .subtitle { color: #64748b; margin-bottom: 28px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 12px 14px; text-align: left; }
            th { width: 36%; background: #f8fafc; color: #334155; }
            .footer { margin-top: 28px; color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <h1>Hóa đơn giao dịch</h1>
            <div class="subtitle">DThang Home - ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
            <table>${rowsHtml}</table>
            <div class="footer">Hóa đơn được xuất từ hệ thống quản lý giao dịch người thuê.</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="tenant-transactions-layout">
      <Navbar />

      <main className="tenant-transactions-content">
        <div className="tenant-transactions-shell">
          <div className="tenant-transactions-page__header">
            <div>
              <p>Người thuê</p>
              <h1>Quản lý giao dịch</h1>
            </div>
            <div className="tenant-transactions-page__actions">
              <Link to="/AccountManagement" className="tenant-transactions-page__back">
                Thông tin tài khoản
              </Link>
              <button
                type="button"
                className="tenant-transactions-page__reload"
                onClick={loadTransactions}
                disabled={loading}
              >
                <i className="fas fa-rotate-right"></i>
                {loading ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>
          </div>

          {error && (
            <div className="tenant-transactions-alert">
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <section className="tenant-transactions-panel">
            <div className="tenant-transactions-panel__title">
              <h2>Giao dịch thuê căn hộ</h2>
              <span>{rows.length} giao dịch</span>
            </div>

            <div className="tenant-transaction-table-wrap">
              <table className="tenant-transaction-table">
                <thead>
                  <tr>
                    <th>Mã hóa đơn</th>
                    <th>Loại giao dịch</th>
                    <th>Số tiền</th>
                    <th>Ngày tạo</th>
                    <th>Ngày thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Mã chuyển khoản</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="tenant-transaction-table__empty">
                        Đang tải giao dịch...
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.invoiceId}</strong>
                        </td>
                        <td>{row.typeLabel}</td>
                        <td>{row.amountText}</td>
                        <td>{row.createdAtText}</td>
                        <td>{row.paidAtText}</td>
                        <td>
                          <span
                            className={`tenant-status tenant-status--${getPaymentStatusTone(
                              row.invoice.trangThaiThanhToan,
                            )}`}
                          >
                            {row.paymentStatusLabel}
                          </span>
                        </td>
                        <td>{row.transferCode}</td>
                        <td>
                          <button
                            type="button"
                            className="tenant-transaction-detail-btn"
                            onClick={() => handleOpenInvoiceDetail(row.invoice)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="tenant-transaction-table__empty">
                        Chưa có giao dịch thuê căn hộ nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {selectedInvoice && (
        <div className="tenant-invoice-modal" role="dialog" aria-modal="true">
          <div className="tenant-invoice-modal__backdrop" onClick={() => setSelectedInvoice(null)} />
          <div className="tenant-invoice-modal__panel">
            <div className="tenant-invoice-modal__header">
              <div>
                <p>Chi tiết giao dịch</p>
                <h3>{selectedInvoice.maHoaDon}</h3>
              </div>
              <button
                type="button"
                className="tenant-invoice-modal__close"
                aria-label="Đóng"
                onClick={() => setSelectedInvoice(null)}
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>

            {invoiceDetailLoading ? (
              <div className="tenant-invoice-modal__loading">Đang tải chi tiết hóa đơn...</div>
            ) : (
              <>
                <div className="tenant-invoice-detail-grid">
                  <div>
                    <span>Mã hóa đơn</span>
                    <strong>{selectedInvoice.maHoaDon}</strong>
                  </div>
                  <div>
                    <span>Loại giao dịch</span>
                    <strong>{getInvoiceTypeLabel(selectedInvoice.loaiHoaDon)}</strong>
                  </div>
                  <div>
                    <span>Số tiền</span>
                    <strong>{formatCurrency(selectedInvoice.soTien)}</strong>
                  </div>
                  <div>
                    <span>Trạng thái thanh toán</span>
                    <strong>{getPaymentStatusLabel(selectedInvoice.trangThaiThanhToan)}</strong>
                  </div>
                  <div>
                    <span>Trạng thái hiệu lực</span>
                    <strong>{getEffectiveStatusLabel(selectedInvoice.trangThaiHieuLuc)}</strong>
                  </div>
                  <div>
                    <span>Mã chuyển khoản</span>
                    <strong>{selectedInvoice.noiDungChuyenKhoan || '-'}</strong>
                  </div>
                  <div>
                    <span>Ngày tạo</span>
                    <strong>{formatDateTime(selectedInvoice.ngayTao)}</strong>
                  </div>
                  <div>
                    <span>Ngày thanh toán</span>
                    <strong>{formatDateTime(selectedInvoice.ngayThanhToan)}</strong>
                  </div>
                  <div>
                    <span>Ngày bắt đầu</span>
                    <strong>{formatDateTime(selectedInvoice.ngayBatDau)}</strong>
                  </div>
                  <div>
                    <span>Ngày kết thúc</span>
                    <strong>{formatDateTime(selectedInvoice.ngayKetThuc)}</strong>
                  </div>
                  <div className="tenant-invoice-detail-grid__wide">
                    <span>Ghi chú</span>
                    <strong>{selectedInvoice.ghiChu || '-'}</strong>
                  </div>
                </div>

                <div className="tenant-invoice-modal__actions">
                  <button
                    type="button"
                    className="tenant-secondary-btn"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="tenant-primary-btn"
                    onClick={() => handleExportInvoice(selectedInvoice)}
                  >
                    <i className="fas fa-file-invoice"></i>
                    Xuất hóa đơn
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantTransactionsPage;
