import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PaymentPage.css';
import { homeMockData } from '../../services/mock/home.mock';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);

const PaymentPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const post = useMemo(() => {
    const allPosts = [...homeMockData.featuredPosts, ...homeMockData.newestPosts];
    const uniquePosts = allPosts.filter(
      (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
    );

    return uniquePosts.find((p) => String(p.id) === String(id));
  }, [id]);

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'banking' | 'zalo'>('momo');
  const depositFee = 500000;
  const serviceFee = 0;
  const total = depositFee + serviceFee;

  if (!post) {
    return (
      <div className="payment-page">
        <div className="payment-shell">
          <div className="payment-empty">
            <h2>Không tìm thấy tin đăng</h2>
            <p>Không thể tạo đơn thanh toán cho bài đăng này.</p>
            <button className="payment-back-btn" onClick={() => navigate('/')}>
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const methods = [
    {
      key: 'momo' as const,
      title: 'Ví MoMo',
      desc: 'Thanh toán nhanh qua ví điện tử',
    },
    {
      key: 'banking' as const,
      title: 'Chuyển khoản ngân hàng',
      desc: 'Phù hợp khi cần xác nhận thủ công',
    },
    {
      key: 'zalo' as const,
      title: 'ZaloPay',
      desc: 'Tốc độ nhanh, thao tác đơn giản',
    },
  ];

  return (
    <div className="payment-page">
      <div className="payment-shell">
        <div className="payment-breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span onClick={() => navigate(`/posts/${post.id}`)}>Chi tiết tin đăng</span>
          <span>/</span>
          <strong>Thanh toán</strong>
        </div>

        <div className="payment-layout">
          <section className="payment-main-card">
            <div className="payment-heading">
              <div>
                <p className="payment-heading-subtitle">Thanh toán / đặt cọc</p>
                <h1 className="payment-heading-title">Xác nhận giữ chỗ tin đăng</h1>
              </div>

              <div className="payment-status-badge">Giữ chỗ 24 giờ</div>
            </div>

            <div className="payment-post-card">
              <img
                src={post.coverImage}
                alt={post.title}
                className="payment-post-image"
              />

              <div className="payment-post-content">
                <h3 className="payment-post-title">{post.title}</h3>

                <div className="payment-post-meta">
                  <span>{post.priceText}</span>
                  <span>{post.areaText}</span>
                  <span>{post.wardText}</span>
                </div>

                <p className="payment-post-address">{post.addressText}</p>
              </div>
            </div>

            <div className="payment-section">
              <h3 className="payment-section-title">Chọn phương thức thanh toán</h3>

              <div className="payment-method-list">
                {methods.map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    className={`payment-method-card ${
                      paymentMethod === method.key ? 'active' : ''
                    }`}
                    onClick={() => setPaymentMethod(method.key)}
                  >
                    <div className="payment-method-radio">
                      <span />
                    </div>

                    <div className="payment-method-info">
                      <h4>{method.title}</h4>
                      <p>{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="payment-section">
              <h3 className="payment-section-title">Thông tin người thanh toán</h3>

              <div className="payment-form-grid">
                <div className="payment-field">
                  <label>Họ và tên</label>
                  <input type="text" placeholder="Nhập họ và tên" />
                </div>

                <div className="payment-field">
                  <label>Số điện thoại</label>
                  <input type="text" placeholder="Nhập số điện thoại" />
                </div>

                <div className="payment-field payment-field--full">
                  <label>Ghi chú</label>
                  <textarea
                    rows={4}
                    placeholder="Ví dụ: giữ phòng giúp tôi đến tối nay"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="payment-summary-card">
            <h3 className="payment-summary-title">Tóm tắt đơn thanh toán</h3>

            <div className="payment-summary-block">
              <div className="payment-summary-row">
                <span>Phí đặt cọc</span>
                <strong>{formatCurrency(depositFee)}đ</strong>
              </div>

              <div className="payment-summary-row">
                <span>Phí dịch vụ</span>
                <strong>{formatCurrency(serviceFee)}đ</strong>
              </div>

              <div className="payment-summary-row">
                <span>Phương thức</span>
                <strong>
                  {paymentMethod === 'momo'
                    ? 'MoMo'
                    : paymentMethod === 'banking'
                    ? 'Chuyển khoản'
                    : 'ZaloPay'}
                </strong>
              </div>

              <div className="payment-summary-row">
                <span>Hiệu lực giữ chỗ</span>
                <strong>24 giờ</strong>
              </div>
            </div>

            <div className="payment-total-box">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(total)}đ</strong>
            </div>

            <button className="payment-confirm-btn">
              Xác nhận thanh toán
            </button>

            <button
              className="payment-secondary-btn"
              onClick={() => navigate(`/posts/${post.id}`)}
            >
              Quay lại chi tiết tin
            </button>

            <div className="payment-note-box">
              Sau khi thanh toán thành công, hệ thống sẽ giữ chỗ tin đăng trong thời gian ngắn
              để bạn ưu tiên liên hệ chủ phòng.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;