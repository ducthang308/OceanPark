import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getHoaDonById } from '../../services/api/PostManagementService';
import type { SepayCreatePaymentResponse } from '../../services/api/PostManagementService';
import Navbar from '../../components/layout/Navbar/navbar';

const SepayPaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const payment = location.state as SepayCreatePaymentResponse | null;

    const [status, setStatus] = useState('PENDING');

    useEffect(() => {
        if (!payment?.maHoaDon) {
            navigate('/payment/all');
            return;
        }

        const interval = setInterval(async () => {
            try {
                const hoaDon = await getHoaDonById(payment.maHoaDon);
                setStatus(hoaDon.trangThaiThanhToan);

                if (hoaDon.trangThaiThanhToan === 'SUCCESS') {
                    clearInterval(interval);
                    alert('Thanh toán thành công. Gói đăng bài đã được kích hoạt!');
                    navigate('/list-post');
                }

                if (hoaDon.trangThaiThanhToan === 'FAILED') {
                    clearInterval(interval);
                    alert('Thanh toán thất bại');
                }
            } catch (error) {
                console.error(error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [payment, navigate]);

    if (!payment) return null;

    return (
        <div className="main-layout">
            <Navbar />

            <div className="content-area">
                <div className="sepay-page">
                    <div className="sepay-card">
                        <h2>Thanh toán gói tin thường</h2>

                        <div className="sepay-price">
                            {payment.soTien.toLocaleString('vi-VN')}đ
                        </div>

                        <img
                            src={payment.qrUrl}
                            alt="QR thanh toán"
                            style={{ width: 280, maxWidth: '100%' }}
                        />

                        <p>Ngân hàng: <b>{payment.bankCode}</b></p>
                        <p>Số tài khoản: <b>{payment.bankAccount}</b></p>
                        <p>Chủ tài khoản: <b>{payment.accountName}</b></p>

                        <p>
                            Nội dung chuyển khoản:{' '}
                            <b style={{ color: 'red' }}>{payment.noiDungChuyenKhoan}</b>
                        </p>

                        <p>Trạng thái: <b>{status}</b></p>
                        <p>Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SepayPaymentPage;