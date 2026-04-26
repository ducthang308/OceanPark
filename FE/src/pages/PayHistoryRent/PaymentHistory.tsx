import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentHistory.css";

type PaymentStatus = "CHO_XAC_NHAN" | "THANH_CONG" | "THAT_BAI" | "DA_HUY";

interface PaymentHistoryItem {
    maGiaoDich: string;
    maHoaDon: string;
    maBaiDang: string;
    tieuDeBaiDang: string;
    diaChi: string;
    hinhAnh: string;
    soTien: number;
    phuongThucThanhToan: string;
    mucDichThanhToan: string;
    ngayTao: string;
    trangThai: PaymentStatus;
}

const mockPayments: PaymentHistoryItem[] = [
    {
        maGiaoDich: "GD001",
        maHoaDon: "HD001",
        maBaiDang: "BD001",
        tieuDeBaiDang: "Căn hộ mini full nội thất gần cầu Rồng",
        diaChi: "55 Lương Thế Vinh, An Hải Bắc, Sơn Trà, Đà Nẵng",
        hinhAnh:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        soTien: 1000000,
        phuongThucThanhToan: "Chuyển khoản ngân hàng",
        mucDichThanhToan: "Đặt cọc thuê căn hộ",
        ngayTao: "2026-04-22 21:15",
        trangThai: "THANH_CONG",
    },
    {
        maGiaoDich: "GD002",
        maHoaDon: "HD002",
        maBaiDang: "BD002",
        tieuDeBaiDang: "Phòng trọ mới xây, có ban công",
        diaChi: "Nguyễn Văn Thoại, Sơn Trà, Đà Nẵng",
        hinhAnh:
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        soTien: 500000,
        phuongThucThanhToan: "Ví điện tử",
        mucDichThanhToan: "Giữ chỗ",
        ngayTao: "2026-04-20 10:30",
        trangThai: "CHO_XAC_NHAN",
    },
];

const formatMoney = (value: number) =>
    value.toLocaleString("vi-VN") + " đ";

const getStatusText = (status: PaymentStatus) => {
    switch (status) {
        case "THANH_CONG":
            return "Thành công";
        case "CHO_XAC_NHAN":
            return "Chờ xác nhận";
        case "THAT_BAI":
            return "Thất bại";
        case "DA_HUY":
            return "Đã hủy";
        default:
            return status;
    }
};

const PaymentHistory = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState("");

    const filteredPayments = useMemo(() => {
        const text = keyword.trim().toLowerCase();

        if (!text) return mockPayments;

        return mockPayments.filter(
            (item) =>
                item.maGiaoDich.toLowerCase().includes(text) ||
                item.maHoaDon.toLowerCase().includes(text) ||
                item.tieuDeBaiDang.toLowerCase().includes(text) ||
                item.diaChi.toLowerCase().includes(text)
        );
    }, [keyword]);

    return (
        <div className="payment-history-page">
            <div className="payment-history-container">
                <div className="payment-history-header">
                    <div>
                        <h1>Lịch sử thanh toán</h1>
                        <p>Theo dõi các giao dịch đặt cọc, giữ chỗ và thuê căn hộ của bạn</p>
                    </div>

                    <div className="payment-history-search">
                        <span>⌕</span>
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo mã giao dịch, hóa đơn, căn hộ..."
                        />
                    </div>
                </div>

                <div className="payment-history-list">
                    {filteredPayments.map((item) => (
                        <article className="payment-history-card" key={item.maGiaoDich}>
                            <div className="payment-history-image-wrap">
                                <img src={item.hinhAnh} alt={item.tieuDeBaiDang} />
                            </div>

                            <div className="payment-history-content">
                                <div className="payment-history-tags">
                                    <span className="payment-history-tag payment-history-tag--purpose">
                                        {item.mucDichThanhToan}
                                    </span>

                                    <span
                                        className={`payment-history-tag payment-history-tag--status status-${item.trangThai}`}
                                    >
                                        {getStatusText(item.trangThai)}
                                    </span>
                                </div>

                                <h2>{item.tieuDeBaiDang}</h2>

                                <p className="payment-history-address">{item.diaChi}</p>

                                <div className="payment-history-meta">
                                    <span>
                                        Mã GD: <strong>{item.maGiaoDich}</strong>
                                    </span>
                                    <span>
                                        Mã HĐ: <strong>{item.maHoaDon}</strong>
                                    </span>
                                    <span>
                                        Ngày tạo: <strong>{item.ngayTao}</strong>
                                    </span>
                                </div>

                                <div className="payment-history-bottom">
                                    <div>
                                        <p>Số tiền</p>
                                        <strong>{formatMoney(item.soTien)}</strong>
                                    </div>

                                    <div>
                                        <p>Phương thức</p>
                                        <strong>{item.phuongThucThanhToan}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-history-actions">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(`/payment-history/${item.maGiaoDich}`)
                                    }
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </article>
                    ))}

                    {filteredPayments.length === 0 && (
                        <div className="payment-history-empty">
                            Không tìm thấy lịch sử thanh toán phù hợp.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;