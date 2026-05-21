import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getHoaDonById } from '../../services/api/PostManagementService';
import type { SepayCreatePaymentResponse } from '../../services/api/PostManagementService';
import Navbar from '../../components/layout/Navbar/navbar';
import './SepayPaymentPage.css';

const SepayPaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const payment = location.state as SepayCreatePaymentResponse | null;

    const [status, setStatus] = useState('PENDING');
    const [title, setTitle] = useState('Thanh toán');

    useEffect(() => {
        if (!payment?.maHoaDon) {
            navigate('/payment/all');
            return;
        }

        const interval = setInterval(async () => {
            try {
                const hoaDon = await getHoaDonById(payment.maHoaDon);

                setStatus(hoaDon.trangThaiThanhToan);

                if (hoaDon.loaiHoaDon === 'DANG_BAI') {
                    setTitle('Thanh toán gói tin thường');
                }

                if (hoaDon.loaiHoaDon === 'THUE_CAN_HO') {
                    setTitle('Thanh toán thuê căn hộ');
                }

                if (hoaDon.trangThaiThanhToan === 'SUCCESS') {
                    clearInterval(interval);

                    if (hoaDon.loaiHoaDon === 'DANG_BAI') {
                        alert('Thanh toán thành công. Gói đăng bài đã được kích hoạt!');
                        navigate('/list-post');
                        return;
                    }

                    if (hoaDon.loaiHoaDon === 'THUE_CAN_HO') {
                        alert('Thanh toán thuê căn hộ thành công!');
                        navigate('/tenant-transactions');
                        return;
                    }

                    navigate('/');
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
                            <div className="sepay-card__heading">
                                <span className="sepay-card__eyebrow">Xác nhận thanh toán</span>
                                <h2>{title}</h2>
                            </div>

                            <div className="sepay-price">
                                {payment.soTien.toLocaleString('vi-VN')}đ
                            </div>
                        </div>

                        <div className="sepay-body">
                            <div className="sepay-qr-panel">
                                <img src={payment.qrUrl} alt="QR thanh toán" />
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
                                    Vui lòng chuyển khoản đúng số tiền và đúng nội dung để hệ thống tự động xác nhận.
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
