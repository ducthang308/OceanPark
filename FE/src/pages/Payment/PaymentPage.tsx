import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentPage.css';
import PricingTable from './components/PricingTable';
import Navbar from '../../components/layout/Navbar/navbar';
import { createSepayPayment } from '../../services/api/PostManagementService';

const getPaymentErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object' && 'message' in data) {
      const messageValue = (data as { message?: unknown }).message;
      if (typeof messageValue === 'string' && messageValue.trim()) return messageValue;
    }
  }

  return 'Tạo thanh toán thất bại';
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePaymentTinThuong = async () => {
    try {
      setLoading(true);

      const maNguoiDung = localStorage.getItem('userId');

      if (!maNguoiDung) {
        alert('Vui lòng đăng nhập trước khi thanh toán');
        navigate('/login');
        return;
      }

      const paymentData = await createSepayPayment({
        maNguoiDung,
        loaiHoaDon: 'DANG_BAI',
        soTien: 50000,
        ghiChu: 'Thanh toán gói tin thường 1 tháng',
      });

      navigate('/payment/sepay', {
        state: paymentData,
      });
    } catch (error) {
      alert(getPaymentErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-layout">
      <Navbar />
      <div className="payment-content-area">
        <div className="payment-page">
          <div className="payment-shell">
            <div className="payment-breadcrumb">
              <span onClick={() => navigate('/')}>Trang chủ</span>
              <span>/</span>
              <strong>Bảng giá dịch vụ</strong>
            </div>

            {/* <div className="payment-header-section">
              <h1>Bảng giá dịch vụ đăng tin</h1>
              <p>Lựa chọn gói tin phù hợp để tối ưu hiệu quả cho thuê phòng của bạn</p>
            </div> */}

            <div className="pricing-wrapper">
              <PricingTable
                onPayment={handlePaymentTinThuong}
                loading={loading}
              />
            </div>

            <div className="pricing-notes">
              <h3>Lưu ý:</h3>
              <ul>
                <li>Gói tin thường có hiệu lực 1 tháng sau khi thanh toán thành công.</li>
                <li>Trong thời hạn gói, người cho thuê có thể đăng nhiều bài.</li>
                <li>Sau khi hết hạn, bạn cần thanh toán lại để tiếp tục đăng bài.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
