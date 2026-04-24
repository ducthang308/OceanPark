import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { adminPayments } from '../../../services/mock/adminStaff.mock';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-payment-approval.css';

const paymentStatusMap: Record<string, { text: string; className: string }> = {
  CHO_XAC_NHAN: { text: 'Chờ xác nhận', className: 'info' },
  DA_THANH_TOAN: { text: 'Đã thanh toán', className: 'success' },
  THAT_BAI: { text: 'Thất bại', className: 'danger' },
  HOAN_TIEN: { text: 'Hoàn tiền', className: 'pending' },
};

const AdminPaymentApproval: React.FC = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState('ALL');
  const [keyword, setKeyword] = useState('');

  const filteredPayments = useMemo(() => {
    return adminPayments.filter((item) => {
      const matchKeyword = [
        item.maGiaoDich,
        item.hoVaTen,
        item.email,
        item.tenPhuongThucThanhToan,
        item.noiDung,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword.toLowerCase().trim());

      const matchStatus = status === 'ALL' ? true : item.trangThai === status;
      return matchKeyword && matchStatus;
    });
  }, [keyword, status]);

  const totalPayments = adminPayments.length;
  const pendingCount = adminPayments.filter((i) => i.trangThai === 'CHO_XAC_NHAN').length;
  const successCount = adminPayments.filter((i) => i.trangThai === 'DA_THANH_TOAN').length;
  const failedCount = adminPayments.filter((i) => i.trangThai === 'THAT_BAI').length;

  const totalRevenue = adminPayments
    .filter((i) => i.trangThai === 'DA_THANH_TOAN')
    .reduce((sum, item) => sum + item.soTien, 0);

  const handleViewDetail = (id: number | string) => {
    navigate(`/admin-staff/payment-approval/${id}`);
  };

  return (
    <div className="payment-approval-page">
      <section className="payment-approval-hero">
        <div>
          <div className="payment-approval-kicker">Đối soát giao dịch</div>
          <h2 className="payment-approval-title">Kiểm tra và xác nhận thanh toán</h2>
          <p className="payment-approval-desc">
            Theo dõi giao dịch đăng bài, rà soát thanh toán lỗi và xử lý các trường hợp
            cần xác nhận thủ công.
          </p>
        </div>

        <div className="payment-approval-hero-actions">
          <button className="admin-btn ghost">Đối soát thủ công</button>
          <button className="admin-btn primary">Xuất báo cáo</button>
        </div>
      </section>

      <section className="payment-summary-grid">
        <div className="payment-summary-card payment-summary-card--blue">
          <div className="payment-summary-card__top">
            <div className="payment-summary-card__icon">
              <CreditCardOutlined />
            </div>
            <span className="payment-summary-card__tag">Tổng quan</span>
          </div>
          <div className="payment-summary-card__label">Tổng giao dịch</div>
          <div className="payment-summary-card__value">{totalPayments}</div>
          <div className="payment-summary-card__note">Toàn bộ giao dịch mock trong hệ thống</div>
        </div>

        <div className="payment-summary-card payment-summary-card--cyan">
          <div className="payment-summary-card__top">
            <div className="payment-summary-card__icon">
              <ClockCircleOutlined />
            </div>
            <span className="payment-summary-card__tag">Ưu tiên</span>
          </div>
          <div className="payment-summary-card__label">Chờ xác nhận</div>
          <div className="payment-summary-card__value">{pendingCount}</div>
          <div className="payment-summary-card__note">Cần nhân viên xử lý sớm</div>
        </div>

        <div className="payment-summary-card payment-summary-card--green">
          <div className="payment-summary-card__top">
            <div className="payment-summary-card__icon">
              <CheckCircleOutlined />
            </div>
            <span className="payment-summary-card__tag">Thành công</span>
          </div>
          <div className="payment-summary-card__label">Đã thanh toán</div>
          <div className="payment-summary-card__value">{successCount}</div>
          <div className="payment-summary-card__note">{formatCurrency(totalRevenue)}</div>
        </div>

        <div className="payment-summary-card payment-summary-card--red">
          <div className="payment-summary-card__top">
            <div className="payment-summary-card__icon">
              <ExclamationCircleOutlined />
            </div>
            <span className="payment-summary-card__tag">Sự cố</span>
          </div>
          <div className="payment-summary-card__label">Thất bại</div>
          <div className="payment-summary-card__value">{failedCount}</div>
          <div className="payment-summary-card__note">Cần rà soát nguyên nhân lỗi</div>
        </div>
      </section>

      <section className="payment-approval-layout payment-approval-layout--single">
        <div className="payment-approval-main">
          <div className="payment-toolbar-card">
            <div className="admin-toolbar payment-toolbar">
              <div className="admin-toolbar-left payment-toolbar-left">
                <div className="payment-search-box">
                  <SearchOutlined className="payment-search-box__icon" />
                  <input
                    className="admin-input payment-search-box__input"
                    placeholder="Tìm theo mã GD, khách hàng, phương thức..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                <select
                  className="admin-select payment-filter-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
                  <option value="DA_THANH_TOAN">Đã thanh toán</option>
                  <option value="THAT_BAI">Thất bại</option>
                  <option value="HOAN_TIEN">Hoàn tiền</option>
                </select>
              </div>

              <div className="payment-toolbar-result">
                Hiển thị <strong>{filteredPayments.length}</strong> giao dịch
              </div>
            </div>
          </div>

          <div className="payment-list-card">
            <div className="payment-table-card__head">
              <div>
                <h3>Danh sách giao dịch</h3>
                <p>Nhấn vào một giao dịch để chuyển sang trang chi tiết riêng.</p>
              </div>
            </div>

            <div className="payment-list">
              {filteredPayments.map((item) => {
                const badge = paymentStatusMap[item.trangThai];

                return (
                  <div key={item.id} className="payment-list-item">
                    <div className="payment-list-item__main">
                      <div className="payment-cell-main">
                        <div className="payment-cell-icon">
                          <WalletOutlined />
                        </div>

                        <div>
                          <div className="payment-transaction-code">{item.maGiaoDich}</div>
                          <div className="admin-meta-text">{item.tenPhuongThucThanhToan}</div>
                        </div>
                      </div>

                      <div className="payment-list-item__content">
                        <div className="payment-customer">
                          <strong>{item.hoVaTen}</strong>
                          <div className="admin-meta-text">{item.email}</div>
                        </div>

                        <div className="payment-purpose">
                          <strong>{item.tenMucDich}</strong>
                          <div className="admin-meta-text">{item.noiDung}</div>
                        </div>
                      </div>
                    </div>

                    <div className="payment-list-item__side">
                      <div className="payment-amount">{formatCurrency(item.soTien)}</div>
                      <div className="payment-created-at">{formatDate(item.ngayTao)}</div>
                      <span className={`admin-badge ${badge.className}`}>{badge.text}</span>

                      <div className="admin-actions payment-actions">
                        <button
                          className="admin-btn ghost"
                          onClick={() => handleViewDetail(item.id)}
                        >
                          Chi tiết
                        </button>

                        <button className="admin-btn success">Xác nhận</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!filteredPayments.length && (
                <div className="payment-list-empty">
                  <h4>Không có giao dịch phù hợp</h4>
                  <p>Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPaymentApproval;