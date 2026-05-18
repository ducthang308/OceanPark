import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './PaymentPage.css';
import PricingTable from './components/PricingTable';
import Navbar from '../../components/layout/Navbar/navbar';
import {
  createSepayPayment,
  getApartmentDetailByPost,
} from '../../services/api/PostManagementService';
import { LANDLORD_ROLE_IDS, ROLE_ID } from '../../constants/roles';
import { getAuthSession } from '../../utils/storage';

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
  const { type } = useParams();
  const [loading, setLoading] = useState(false);
  const [rentalAmount, setRentalAmount] = useState<number | null>(null);
  const [rentalAmountLoading, setRentalAmountLoading] = useState(false);
  const session = getAuthSession();
  const paymentTarget = type && type !== 'all' ? type : '';
  const isTenantRentalPayment = Boolean(
    paymentTarget && session?.roleId === ROLE_ID.NGUOI_THUE,
  );
  const canPayPostingPackage = Boolean(
    session?.roleId && LANDLORD_ROLE_IDS.includes(session.roleId),
  );
  const shouldBlockPaymentPage = !isTenantRentalPayment && !canPayPostingPackage;

  useEffect(() => {
    if (shouldBlockPaymentPage) {
      navigate('/', { replace: true });
    }
  }, [navigate, shouldBlockPaymentPage]);

  useEffect(() => {
    let ignore = false;

    const loadRentalAmount = async () => {
      if (!isTenantRentalPayment || !paymentTarget) {
        setRentalAmount(null);
        return;
      }

      setRentalAmountLoading(true);

      try {
        const detail = await getApartmentDetailByPost(paymentTarget);

        if (!ignore) {
          setRentalAmount(
            typeof detail.gia === 'number' && detail.gia > 0 ? detail.gia : null,
          );
        }
      } catch {
        if (!ignore) setRentalAmount(null);
      } finally {
        if (!ignore) setRentalAmountLoading(false);
      }
    };

    void loadRentalAmount();

    return () => {
      ignore = true;
    };
  }, [isTenantRentalPayment, paymentTarget]);

  const handlePaymentTinThuong = async () => {
    try {
      setLoading(true);

      const maNguoiDung = session?.user.maNguoiDung || localStorage.getItem('userId');

      if (!maNguoiDung) {
        alert('Vui lòng đăng nhập trước khi thanh toán');
        navigate('/login');
        return;
      }

      if (!isTenantRentalPayment && !canPayPostingPackage) {
        alert('Bảng giá đăng tin chỉ dành cho người cho thuê');
        navigate('/');
        return;
      }

      const loaiHoaDon = isTenantRentalPayment ? 'THUE_CAN_HO' : 'DANG_BAI';
      let soTien = 50000;
      let ghiChu = paymentTarget
        ? `Thanh toán gói tin thường 1 tháng - Bài đăng ${paymentTarget}`
        : 'Thanh toán gói tin thường 1 tháng';

      if (isTenantRentalPayment) {
        soTien = rentalAmount ?? 0;
        ghiChu = `Thanh toán thuê/cọc căn hộ - Bài đăng ${paymentTarget}`;

        if (soTien <= 0) {
          alert('Không tìm thấy giá căn hộ để tạo thanh toán');
          return;
        }
      }

      const paymentData = await createSepayPayment({
        maNguoiDung,
        loaiHoaDon,
        soTien,
        maBaiDang: paymentTarget || undefined,
        ghiChu,
      });

      navigate('/payment/sepay', {
        state: {
          ...paymentData,
          loaiHoaDon,
          maBaiDang: paymentTarget || undefined,
        },
      });
    } catch (error) {
      alert(getPaymentErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (shouldBlockPaymentPage) return null;

  return (
    <div className="payment-layout">
      <Navbar />
      <div className="payment-content-area">
        <div className="payment-page">
          <div className="payment-shell">
            <div className="payment-breadcrumb">
              <span onClick={() => navigate('/')}>Trang chủ</span>
              <span>/</span>
              <strong>{isTenantRentalPayment ? 'Thanh toán thuê căn hộ' : 'Bảng giá dịch vụ'}</strong>
            </div>

            {/* <div className="payment-header-section">
              <h1>Bảng giá dịch vụ đăng tin</h1>
              <p>Lựa chọn gói tin phù hợp để tối ưu hiệu quả cho thuê phòng của bạn</p>
            </div> */}

            {isTenantRentalPayment ? (
              <div className="rental-payment-card">
                <span>Thanh toán thuê/cọc</span>
                <h1>Bài đăng {paymentTarget}</h1>
                <p>
                  Hóa đơn sẽ được tạo với loại giao dịch thuê căn hộ để hiển thị trong
                  trang quản lý giao dịch của người thuê.
                </p>
                <strong>
                  {rentalAmountLoading
                    ? 'Đang tải giá...'
                    : rentalAmount
                      ? `${rentalAmount.toLocaleString('vi-VN')}đ`
                      : 'Chưa có giá'}
                </strong>
                <button
                  type="button"
                  onClick={handlePaymentTinThuong}
                  disabled={loading || rentalAmountLoading || !rentalAmount}
                >
                  {loading ? 'Đang tạo thanh toán...' : 'Tạo thanh toán'}
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
