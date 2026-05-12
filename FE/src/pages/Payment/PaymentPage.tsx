import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentPage.css';
import PricingTable from './components/PricingTable';
import Navbar from '../../components/layout/Navbar/navbar';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="main-layout">
      <Navbar />
      <div className="content-area">
        <div className="payment-page">
          <div className="payment-shell">
            <div className="payment-breadcrumb">
              <span onClick={() => navigate('/')}>Trang chủ</span>
              <span>/</span>
              <strong>Bảng giá dịch vụ</strong>
            </div>

            <div className="payment-header-section">
              <h1>Bảng giá dịch vụ đăng tin</h1>
              <p>Lựa chọn gói tin phù hợp để tối ưu hiệu quả cho thuê phòng của bạn</p>
            </div>

            <div className="pricing-wrapper">
              <PricingTable />
            </div>

            <div className="pricing-notes">
              <h3>Lưu ý:</h3>
              <ul>
                <li>Tất cả các gói tin đều có hiệu lực ngay sau khi thanh toán thành công.</li>
                <li>Tin VIP Nổi Bật sẽ được hiển thị ở vị trí đầu tiên trên trang chủ và các trang danh mục.</li>
                <li>(*) Tự động duyệt: Tin của bạn sẽ được hệ thống tự động kiểm duyệt và hiển thị ngay lập tức (vẫn tuân thủ điều khoản sử dụng).</li>
                <li>Mọi thắc mắc vui lòng liên hệ bộ phận CSKH để được hỗ trợ 24/7.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;