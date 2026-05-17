import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getHoaDonById } from '../../services/api/PostManagementService';
import type { SepayCreatePaymentResponse } from '../../services/api/PostManagementService';
import Navbar from '../../components/layout/Navbar/navbar';
import './SepayPaymentPage.css';

type SepayPaymentState = SepayCreatePaymentResponse & {
    loaiHoaDon?: 'DANG_BAI' | 'THUE_CAN_HO';
    maBaiDang?: string;
};

const SepayPaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const payment = location.state as SepayPaymentState | null;

    const [status, setStatus] = useState('PENDING');
    const isRentalPayment = payment?.loaiHoaDon === 'THUE_CAN_HO';

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
                    const paidRentalInvoice = hoaDon.loaiHoaDon === 'THUE_CAN_HO';
                    alert(
                        paidRentalInvoice
                            ? 'Thanh toán thuê căn hộ thành công!'
                            : 'Thanh toán thành công. Gói đăng bài đã được kích hoạt!',
                    );
                    navigate(paidRentalInvoice ? '/tenant-transactions' : '/list-post');
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
        <div className="sepay-layout">
            <Navbar />

            <div className="sepay-content-area">
                <div className="sepay-page">
                    <div className="sepay-card">
                        <div className="sepay-card__header">
                            <h2>{isRentalPayment ? 'Thanh toán thuê căn hộ' : 'Thanh toán gói tin thường'}</h2>

                            <div className="sepay-price">
                                {payment.soTien.toLocaleString('vi-VN')}đ
                            </div>
                        </div>

                        <div className="sepay-body">
                            <div className="sepay-qr-panel">
                                <img
                                    src={payment.qrUrl}
                                    alt="QR thanh toán"
                                />
                            </div>

                            <div className="sepay-info">
                                <div className="sepay-info-item">
                                    <span className="sepay-info-label">Ngân hàng</span>
                                    <b className="sepay-info-value">{payment.bankCode}</b>
                                </div>

                                <div className="sepay-info-item">
                                    <span className="sepay-info-label">Số tài khoản</span>
                                    <b className="sepay-info-value">{payment.bankAccount}</b>
                                </div>

                                <div className="sepay-info-item">
                                    <span className="sepay-info-label">Chủ tài khoản</span>
                                    <b className="sepay-info-value">{payment.accountName}</b>
                                </div>

                                <div className="sepay-info-item sepay-info-item--code">
                                    <span className="sepay-info-label">Nội dung chuyển khoản</span>
                                    <b className="sepay-info-value sepay-transfer-code">
                                        {payment.noiDungChuyenKhoan}
                                    </b>
                                </div>

                                <div className={`sepay-status ${status.toLowerCase()}`}>
                                    Trạng thái: <b>{status}</b>
                                </div>

                                <p className="sepay-note">
                                    {isRentalPayment
                                        ? 'Hệ thống sẽ ghi nhận giao dịch thuê căn hộ sau khi nhận được tiền.'
                                        : 'Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SepayPaymentPage;
