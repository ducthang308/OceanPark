import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  MailOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { adminPayments } from '../../../services/mock/adminStaff.mock';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-payment-detail.css';

const paymentStatusMap: Record<string, { text: string; className: string }> = {
  CHO_XAC_NHAN: { text: 'Chờ xác nhận', className: 'info' },
  DA_THANH_TOAN: { text: 'Đã thanh toán', className: 'success' },
  THAT_BAI: { text: 'Thất bại', className: 'danger' },
  HOAN_TIEN: { text: 'Hoàn tiền', className: 'pending' },
};

const PaymentDetailPanel: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const payment = adminPayments.find((item) => String(item.id) === String(id));

  if (!payment) {
    return (
      <div className="payment-detail-page">
        <div className="payment-detail-notfound">
          <h2>Không tìm thấy giao dịch</h2>
          <p>Giao dịch này không tồn tại hoặc đã bị xóa khỏi dữ liệu mock.</p>
          <button
            className="admin-btn ghost"
            onClick={() => navigate('/admin-staff/payment-approval')}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const badge = paymentStatusMap[payment.trangThai] || {
    text: 'Không xác định',
    className: 'info',
  };

  return (
    <div className="payment-detail-page">
      <section className="payment-detail-hero">
        <div className="payment-detail-hero__left">
          <button
            className="payment-detail-back"
            onClick={() => navigate('/admin-staff/payment-approval')}
          >
            <ArrowLeftOutlined />
            <span>Quay lại danh sách</span>
          </button>

          <div className="payment-detail-kicker">Chi tiết giao dịch</div>
          <h1 className="payment-detail-title">{payment.maGiaoDich}</h1>
          <p className="payment-detail-desc">
            Xem đầy đủ thông tin giao dịch, người thanh toán, mục đích và trạng thái xử lý.
          </p>
        </div>

        <div className="payment-detail-hero__right">
          <div className="payment-detail-amount">{formatCurrency(payment.soTien)}</div>
          <span className={`admin-badge ${badge.className}`}>{badge.text}</span>
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
                <strong>{payment.maGiaoDich}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Phương thức thanh toán</span>
                <strong>{payment.tenPhuongThucThanhToan}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Mục đích thanh toán</span>
                <strong>{payment.tenMucDich}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Ngày tạo</span>
                <strong>{formatDate(payment.ngayTao)}</strong>
              </div>

              <div className="payment-detail-item payment-detail-item--full">
                <span>Nội dung</span>
                <strong>{payment.noiDung}</strong>
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
                <strong>{payment.hoVaTen}</strong>
              </div>

              <div className="payment-detail-item">
                <span>Email</span>
                <strong>{payment.email}</strong>
              </div>

              {'soDienThoai' in payment && payment.soDienThoai && (
                <div className="payment-detail-item">
                  <span>Số điện thoại</span>
                  <strong>{payment.soDienThoai}</strong>
                </div>
              )}

       
              </div>
          </div>

          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Tiến trình xử lý</h3>
              <CalendarOutlined />
            </div>

            <div className="payment-timeline">
              <div className="payment-timeline-item">
                <div className="payment-timeline-item__icon is-done">
                  <FileTextOutlined />
                </div>
                <div>
                  <strong>Giao dịch được tạo</strong>
                  <p>{formatDate(payment.ngayTao)}</p>
                </div>
              </div>

              <div className="payment-timeline-item">
                <div
                  className={`payment-timeline-item__icon ${
                    payment.trangThai === 'CHO_XAC_NHAN' ? 'is-current' : 'is-done'
                  }`}
                >
                  <ClockCircleOutlined />
                </div>
                <div>
                  <strong>Chờ xác nhận</strong>
                  <p>Đang chờ nhân viên kiểm tra đối soát giao dịch.</p>
                </div>
              </div>

              <div className="payment-timeline-item">
                <div
                  className={`payment-timeline-item__icon ${
                    payment.trangThai === 'DA_THANH_TOAN'
                      ? 'is-success'
                      : payment.trangThai === 'THAT_BAI'
                      ? 'is-danger'
                      : payment.trangThai === 'HOAN_TIEN'
                      ? 'is-pending'
                      : ''
                  }`}
                >
                  {payment.trangThai === 'DA_THANH_TOAN' ? (
                    <CheckCircleOutlined />
                  ) : payment.trangThai === 'THAT_BAI' ? (
                    <ExclamationCircleOutlined />
                  ) : payment.trangThai === 'HOAN_TIEN' ? (
                    <BankOutlined />
                  ) : (
                    <WalletOutlined />
                  )}
                </div>
                <div>
                  <strong>Trạng thái cuối</strong>
                  <p>{badge.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="payment-detail-side">
          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Thao tác nhanh</h3>
              <WalletOutlined />
            </div>

            <div className="payment-detail-actions">
              <button className="admin-btn success">Xác nhận thanh toán</button>
              <button className="admin-btn danger">Đánh dấu thất bại</button>
              <button className="admin-btn ghost">Hoàn tiền</button>
            </div>
          </div>

          <div className="payment-detail-card">
            <div className="payment-detail-card__head">
              <h3>Ghi chú xử lý</h3>
              <FileTextOutlined />
            </div>

            <div className="payment-detail-note">
              Kiểm tra thông tin giao dịch, đối chiếu phương thức thanh toán và xác nhận thủ công
              nếu cần. Có thể mở rộng phần này thành textarea hoặc lịch sử xử lý sau.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default PaymentDetailPanel;