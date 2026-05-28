import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  FileTextOutlined,
  MailOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { getInvoiceById, type HoaDonDTO } from '../../../services/api/AdminPaymentService';
import { getUserById, type UserProfileResponse } from '../../../services/api/UserService';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { openInvoicePrintWindow } from '../../../utils/invoicePrint';
import type { InvoicePrintRow } from '../../../utils/invoicePrint';
import './admin-payment-detail.css';

const paymentStatusMap: Record<string, { text: string; className: string }> = {
  CHO_XAC_NHAN: { text: 'Chờ xác nhận', className: 'info' },
  DA_THANH_TOAN: { text: 'Đã thanh toán', className: 'success' },
  THAT_BAI: { text: 'Thất bại', className: 'danger' },
  HOAN_TIEN: { text: 'Hoàn tiền', className: 'pending' },
};

const getUIStatus = (status: string): string => {
  if (!status) return 'CHO_XAC_NHAN';
  const clean = status.toUpperCase();
  if (clean === 'DA_THANH_TOAN' || clean === 'PAID' || clean === 'SUCCESS') {
    return 'DA_THANH_TOAN';
  }
  if (clean === 'THAT_BAI' || clean === 'FAILED' || clean === 'CANCELLED') {
    return 'THAT_BAI';
  }
  if (clean === 'HOAN_TIEN' || clean === 'REFUNDED') {
    return 'HOAN_TIEN';
  }
  return 'CHO_XAC_NHAN';
};

const getLoaiHoaDonLabel = (type: string): string => {
  if (!type) return 'Dịch vụ';
  const clean = type.toUpperCase();
  if (clean === 'DANG_BAI') return 'Thanh toán phí đăng tin';
  if (clean === 'THUE_CAN_HO') return 'Đặt cọc thuê căn hộ';
  if (clean === 'MUA_GOI') return 'Mua gói bài đăng';
  return `Thanh toán ${type}`;
};

const isInvoicePrintable = (invoice: HoaDonDTO) =>
  getUIStatus(invoice.trangThaiThanhToan) === 'DA_THANH_TOAN';

const PaymentDetailPanel: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payment, setPayment] = useState<HoaDonDTO | null>(null);
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const invoiceData = await getInvoiceById(id);
        setPayment(invoiceData);

        if (invoiceData.maNguoiDung) {
          try {
            const userData = await getUserById(invoiceData.maNguoiDung);
            setUser(userData);
          } catch (userErr) {
            console.error('Failed to load user info', userErr);
          }
        }
      } catch (err) {
        console.error('Failed to load invoice detail', err);
        setError('Không tìm thấy thông tin giao dịch này trên hệ thống.');
      } finally {
        setLoading(false);
      }
    };
    void loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="payment-detail-page">
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px', fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
          Đang tải chi tiết giao dịch...
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="payment-detail-page">
        <div className="payment-detail-notfound">
          <h2>Không tìm thấy giao dịch</h2>
          <p>{error || 'Giao dịch này không tồn tại hoặc đã bị xóa.'}</p>
          <button
            className="admin-btn ghost"
            onClick={() => navigate('/admin/payments')}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const uiStatus = getUIStatus(payment.trangThaiThanhToan);
  const badge = paymentStatusMap[uiStatus] || {
    text: payment.trangThaiThanhToan || 'Không xác định',
    className: 'info',
  };

  const handlePrintInvoice = () => {
    if (!isInvoicePrintable(payment)) {
      message.warning('Chỉ có thể in hóa đơn khi giao dịch thành công');
      return;
    }

    const rows: InvoicePrintRow[] = [
      ['Mã hóa đơn', payment.maHoaDon],
      ['Người thanh toán', user?.hoVaTen || payment.maNguoiDung || '-'],
      ['Email', user?.email || '-'],
      ['Số điện thoại', user?.soDienThoai || '-'],
      ['Bài đăng', payment.maBaiDang || '-'],
      ['Loại giao dịch', getLoaiHoaDonLabel(payment.loaiHoaDon)],
      ['Số tiền', formatCurrency(payment.soTien)],
      ['Trạng thái thanh toán', badge.text],
      ['Mã chuyển khoản', payment.noiDungChuyenKhoan || '-'],
      ['Ghi chú', payment.ghiChu || '-'],
      ['Ngày tạo', formatDate(payment.ngayTao)],
      ['Ngày thanh toán', formatDate(payment.ngayThanhToan || undefined)],
      ['Ngày bắt đầu', formatDate(payment.ngayBatDau || undefined)],
      ['Ngày kết thúc', formatDate(payment.ngayKetThuc || undefined)],
    ];

    const didOpen = openInvoicePrintWindow({
      title: 'Hóa đơn thanh toán',
      documentTitle: `Hóa đơn ${payment.maHoaDon}`,
      generatedAt: formatDate(new Date()),
      rows,
      footer: 'Hóa đơn được xuất từ hệ thống quản trị DThang Home.',
      signerLabel: 'Chữ ký khách hàng',
    });

    if (!didOpen) {
      message.error('Trình duyệt đang chặn cửa sổ xuất hóa đơn');
    }
  };

  return (
    <div className="payment-detail-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          className="payment-detail-back"
          onClick={() => navigate('/admin/payments')}
        >
          <ArrowLeftOutlined />
          <span>Quay lại danh sách</span>
        </button>

        <button
          className="payment-detail-back"
          disabled={!isInvoicePrintable(payment)}
          onClick={handlePrintInvoice}
        >
          <DownloadOutlined />
          <span>In hóa đơn</span>
        </button>
      </div>

      <section className="payment-detail-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <div className="payment-detail-hero__left" style={{ flex: '1', minWidth: '280px' }}>
          <div className="payment-detail-kicker" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e3a8a', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Chi tiết giao dịch</div>
          
          <div className="payment-detail-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 className="payment-detail-title" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{payment.maHoaDon}</h1>
            <span className={`admin-badge ${badge.className}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.95rem' }}>{badge.text}</span>
          </div>

          <p className="payment-detail-desc" style={{ margin: '1rem 0 0 0', color: '#64748b', fontSize: '0.925rem', lineHeight: '1.5', maxWidth: '600px' }}>
            Xem đầy đủ thông tin giao dịch, người thanh toán, mục đích và trạng thái xử lý tự động.
          </p>
        </div>

        <div className="payment-detail-hero__right" style={{ textAlign: 'right', background: 'white', padding: '1.25rem 2rem', borderRadius: '12px', border: '1px dashed #cbd5e1', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', display: 'inline-block', minWidth: '240px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Số tiền giao dịch</div>
          <div className="payment-detail-amount" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{formatCurrency(payment.soTien)}</div>
        </div>
      </section>

      <section className="payment-detail-layout">
        <div className="payment-detail-main">
          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Thông tin giao dịch</h3>
              <CreditCardOutlined />
            </div>

            <div className="payment-detail-grid">
              <div className="payment-detail-item">
                <span>Mã giao dịch</span>
                <strong>{payment.maHoaDon}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Phương thức thanh toán</span>
                <strong>Chuyển khoản cổng thanh toán tự động</strong>
              </div>

              <div className="payment-detail-item">
                <span>Mục đích thanh toán</span>
                <strong>{getLoaiHoaDonLabel(payment.loaiHoaDon)}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Ngày tạo</span>
                <strong>{formatDate(payment.ngayTao)}</strong>
              </div>

              <div className="payment-detail-item payment-detail-item--full">
                <span>Nội dung</span>
                <strong>{payment.noiDungChuyenKhoan || 'Không có nội dung'}</strong>
              </div>
            </div>
          </div>

          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Người thanh toán</h3>
              <MailOutlined />
            </div>

            <div className="payment-detail-grid">
              <div className="payment-detail-item">
                <span>Họ và tên</span>
                <strong>{user?.hoVaTen || 'Khách vãng lai'}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Email</span>
                <strong>{user?.email || 'N/A'}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Số điện thoại</span>
                <strong>{user?.soDienThoai || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="payment-detail-side">
          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Trạng thái xử lý</h3>
              <WalletOutlined />
            </div>

            <div className="payment-detail-auto-info" style={{ color: '#0b9370', fontWeight: 600, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
              <CheckCircleOutlined />
              <span>Giao dịch đối soát tự động</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              Giao dịch này được ghi nhận và đồng bộ tự động từ cổng thanh toán. Không cần xử lý thủ công.
            </p>
          </div>

          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Ghi chú hệ thống</h3>
              <FileTextOutlined />
            </div>

            <div className="payment-detail-note">
              Thông tin giao dịch được đối chiếu tự động với phương thức thanh toán và cập nhật trạng thái ngay khi nhận được tín hiệu Webhook từ cổng thanh toán.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default PaymentDetailPanel;
