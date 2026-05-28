import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { getAllInvoices, type HoaDonDTO } from '../../../services/api/AdminPaymentService';
import { getAllUsers, type AdminUserDTO } from '../../../services/api/AdminAccountService';
import AdminPagination from '../components/AdminPagination';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { openInvoicePrintWindow } from '../../../utils/invoicePrint';
import type { InvoicePrintRow } from '../../../utils/invoicePrint';
import './admin-payment-approval.css';

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

const AdminPaymentApproval: React.FC = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<HoaDonDTO[]>([]);
  const [users, setUsers] = useState<Record<string, AdminUserDTO>>({});
  const [status, setStatus] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [invoicesData, usersData] = await Promise.all([
          getAllInvoices(),
          getAllUsers(),
        ]);
        setPayments(invoicesData);

        const userMap: Record<string, AdminUserDTO> = {};
        usersData.forEach((u) => {
          if (u.maNguoiDung) {
            userMap[u.maNguoiDung] = u;
          }
        });
        setUsers(userMap);
      } catch (err) {
        console.error('Failed to load transaction data', err);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, status]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const user = item.maNguoiDung ? users[item.maNguoiDung] : null;
      const userName = user?.hoVaTen || 'Khách vãng lai';
      const userEmail = user?.email || 'N/A';
      const loaiLabel = getLoaiHoaDonLabel(item.loaiHoaDon);

      const matchKeyword = [
        item.maHoaDon,
        userName,
        userEmail,
        loaiLabel,
        item.noiDungChuyenKhoan || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword.toLowerCase().trim());

      const uiStatus = getUIStatus(item.trangThaiThanhToan);
      const matchStatus = status === 'ALL' ? true : uiStatus === status;
      return matchKeyword && matchStatus;
    });
  }, [payments, users, keyword, status]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalPayments = payments.length;
  const pendingCount = payments.filter((i) => getUIStatus(i.trangThaiThanhToan) === 'CHO_XAC_NHAN').length;
  const successCount = payments.filter((i) => getUIStatus(i.trangThaiThanhToan) === 'DA_THANH_TOAN').length;
  const failedCount = payments.filter((i) => getUIStatus(i.trangThaiThanhToan) === 'THAT_BAI').length;

  const totalRevenue = payments
    .filter((i) => getUIStatus(i.trangThaiThanhToan) === 'DA_THANH_TOAN')
    .reduce((sum, item) => sum + item.soTien, 0);

  const handleViewDetail = (id: string) => {
    navigate(`/admin/payment-approval/${id}`);
  };

  const handlePrintInvoice = (invoice: HoaDonDTO) => {
    if (!isInvoicePrintable(invoice)) {
      message.warning('Chỉ có thể in hóa đơn khi giao dịch thành công');
      return;
    }

    const user = invoice.maNguoiDung ? users[invoice.maNguoiDung] : null;
    const rows: InvoicePrintRow[] = [
      ['Mã hóa đơn', invoice.maHoaDon],
      ['Khách hàng', user?.hoVaTen || invoice.maNguoiDung || '-'],
      ['Email', user?.email || '-'],
      ['Bài đăng', invoice.maBaiDang || '-'],
      ['Loại giao dịch', getLoaiHoaDonLabel(invoice.loaiHoaDon)],
      ['Số tiền', formatCurrency(invoice.soTien)],
      ['Trạng thái thanh toán', paymentStatusMap[getUIStatus(invoice.trangThaiThanhToan)].text],
      ['Mã chuyển khoản', invoice.noiDungChuyenKhoan || '-'],
      ['Ghi chú', invoice.ghiChu || '-'],
      ['Ngày tạo', formatDate(invoice.ngayTao)],
      ['Ngày thanh toán', formatDate(invoice.ngayThanhToan || undefined)],
      ['Ngày bắt đầu', formatDate(invoice.ngayBatDau || undefined)],
      ['Ngày kết thúc', formatDate(invoice.ngayKetThuc || undefined)],
    ];

    const didOpen = openInvoicePrintWindow({
      title: 'Hóa đơn thanh toán',
      documentTitle: `Hóa đơn ${invoice.maHoaDon}`,
      generatedAt: formatDate(new Date()),
      rows,
      footer: 'Hóa đơn được xuất từ hệ thống quản trị DThang Home.',
      signerLabel: 'Chữ ký khách hàng',
    });

    if (!didOpen) {
      message.error('Trình duyệt đang chặn cửa sổ xuất hóa đơn');
    }
  };

  if (loading) {
    return (
      <div className="payment-approval-page">
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px', fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
          Đang tải danh sách giao dịch...
        </div>
      </div>
    );
  }

  return (
    <div className="payment-approval-page">
      <section className="payment-approval-hero">
        <div>
          <div className="payment-approval-kicker">Lịch sử giao dịch</div>
          <h2 className="payment-approval-title">Quản lý và theo dõi thanh toán</h2>
          <p className="payment-approval-desc">
            Theo dõi tất cả giao dịch thanh toán, hóa đơn đăng bài và lịch sử nạp tiền tự động trên hệ thống.
          </p>
        </div>

        <div className="payment-approval-hero-actions">
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
          <div className="payment-summary-card__note">Toàn bộ giao dịch trên hệ thống</div>
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
          <div className="payment-summary-card__note">Các giao dịch đang xử lý</div>
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
          <div className="payment-summary-card__note">Giao dịch bị từ chối hoặc lỗi</div>
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
                    placeholder="Tìm theo mã GD, khách hàng, nội dung..."
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
            <div className="payment-table-card__head" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
              <div>
                <h3>Danh sách giao dịch</h3>
                <p>Nhấp vào một dòng giao dịch bất kỳ để xem thông tin chi tiết.</p>
              </div>
            </div>

            <div className="payment-table-container" style={{ overflowX: 'auto', padding: '0 1.5rem 1.5rem 1.5rem', minHeight: '580px', position: 'relative' }}>
              <table className="payment-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '14%' }}>Mã giao dịch</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '22%' }}>Khách hàng</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '20%' }}>Mục đích</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '14%' }}>Số tiền</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '12%' }}>Thời gian</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '10%' }}>Trạng thái</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '12%', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((item) => {
                    const uiStatus = getUIStatus(item.trangThaiThanhToan);
                    const badge = paymentStatusMap[uiStatus] || { text: item.trangThaiThanhToan || 'Lỗi', className: 'danger' };
                    const user = item.maNguoiDung ? users[item.maNguoiDung] : null;
                    const userName = user?.hoVaTen || 'Khách vãng lai';
                    const userEmail = user?.email || 'N/A';

                    return (
                      <tr 
                        key={item.maHoaDon} 
                        className="payment-table-row" 
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        onClick={() => handleViewDetail(item.maHoaDon)}
                      >
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.maHoaDon}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>Tự động cổng thanh toán</div>
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{userName}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>{userEmail}</div>
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{getLoaiHoaDonLabel(item.loaiHoaDon)}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.noiDungChuyenKhoan || 'Không có nội dung'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle', fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                          {formatCurrency(item.soTien)}
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDate(item.ngayTao)}
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle' }}>
                          <span className={`admin-badge ${badge.className}`} style={{ display: 'inline-block' }}>{badge.text}</span>
                        </td>
                        <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="admin-btn ghost"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                              onClick={() => handleViewDetail(item.maHoaDon)}
                            >
                              Chi tiết
                            </button>
                            <button
                              className="admin-btn ghost"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                              disabled={!isInvoicePrintable(item)}
                              onClick={() => handlePrintInvoice(item)}
                            >
                              <DownloadOutlined />
                              In
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredPayments.length && (
                <div className="payment-list-empty" style={{ display: 'grid', placeItems: 'center', height: '400px', color: '#64748b', textAlign: 'center', width: '100%' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Không có giao dịch phù hợp</h4>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                  </div>
                </div>
              )}
            </div>

            {filteredPayments.length > 0 && (
              <div style={{ margin: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <AdminPagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredPayments.length}
                  itemLabel="giao dịch"
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPaymentApproval;
