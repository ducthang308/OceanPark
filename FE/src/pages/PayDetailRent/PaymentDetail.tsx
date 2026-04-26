import { useNavigate, useParams } from "react-router-dom";
import "./PaymentDetail.css";

type PaymentStatus = "CHO_XAC_NHAN" | "THANH_CONG" | "THAT_BAI" | "DA_HUY";

interface PaymentDetailData {
    maGiaoDich: string;
    maHoaDon: string;
    maChiTietThanhToan: string;
    maBaiDang: string;
    tieuDeBaiDang: string;
    diaChi: string;
    nguoiThanhToan: string;
    nguoiNhan: string;
    soTien: number;
    phuongThucThanhToan: string;
    mucDichThanhToan: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    ngayTao: string;
    trangThai: PaymentStatus;
    noiDung: string;
    ghiChu: string;
}

const mockPaymentDetails: PaymentDetailData[] = [
    {
        maGiaoDich: "GD001",
        maHoaDon: "HD001",
        maChiTietThanhToan: "CTTT001",
        maBaiDang: "BD001",
        tieuDeBaiDang: "Căn hộ mini full nội thất gần cầu Rồng",
        diaChi: "55 Lương Thế Vinh, An Hải Bắc, Sơn Trà, Đà Nẵng",
        nguoiThanhToan: "Nguyễn Văn A",
        nguoiNhan: "Nguyễn Minh Quân",
        soTien: 1000000,
        phuongThucThanhToan: "Chuyển khoản ngân hàng",
        mucDichThanhToan: "Đặt cọc thuê căn hộ",
        ngayBatDau: "2026-04-22",
        ngayKetThuc: "2026-05-22",
        ngayTao: "2026-04-22 21:15",
        trangThai: "THANH_CONG",
        noiDung: "Đặt cọc giữ chỗ căn hộ BD001",
        ghiChu: "Người thuê đã thanh toán tiền cọc. Chủ căn hộ cần xác nhận giữ chỗ.",
    },
    {
        maGiaoDich: "GD002",
        maHoaDon: "HD002",
        maChiTietThanhToan: "CTTT002",
        maBaiDang: "BD002",
        tieuDeBaiDang: "Phòng trọ mới xây, có ban công",
        diaChi: "Nguyễn Văn Thoại, Sơn Trà, Đà Nẵng",
        nguoiThanhToan: "Trần Thị B",
        nguoiNhan: "Lê Văn C",
        soTien: 500000,
        phuongThucThanhToan: "Ví điện tử",
        mucDichThanhToan: "Giữ chỗ",
        ngayBatDau: "2026-04-20",
        ngayKetThuc: "2026-05-20",
        ngayTao: "2026-04-20 10:30",
        trangThai: "CHO_XAC_NHAN",
        noiDung: "Thanh toán giữ chỗ bài đăng BD002",
        ghiChu: "Giao dịch đang chờ xác nhận.",
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

const PaymentDetail = () => {
    const { maGiaoDich } = useParams();
    const navigate = useNavigate();

    const payment = mockPaymentDetails.find(
        (item) => item.maGiaoDich === maGiaoDich
    );

    if (!payment) {
        return (
            <div className="payment-detail-page">
                <div className="payment-detail-empty">
                    <h2>Không tìm thấy giao dịch</h2>
                    <button onClick={() => navigate("/payment-history")}>
                        Quay lại lịch sử
                    </button>
                </div>
            </div>
        );
    }

    const handlePrintInvoice = () => {
        if (payment.trangThai !== "THANH_CONG") {
            alert("Chỉ giao dịch thành công mới được in hóa đơn");
            return;
        }

        window.print();
    };

    return (
        <div className="payment-detail-page">
            <div className="payment-detail-container">
                <button className="payment-detail-back" onClick={() => navigate(-1)}>
                    ← Quay lại
                </button>

                <div className="payment-detail-layout invoice-print-area">
                    <section className="payment-detail-main-card">
                        <div className="payment-detail-invoice-header">
                            <div>
                                <h2>DThang Home</h2>
                                <p>Hóa đơn thanh toán đặt cọc thuê căn hộ</p>
                            </div>

                            <div className="payment-detail-invoice-code">
                                <span>Mã hóa đơn</span>
                                <strong>{payment.maHoaDon}</strong>
                            </div>
                        </div>

                        <div className="payment-detail-title-row">
                            <div>
                                <p className="payment-detail-label">Chi tiết thanh toán</p>
                                <h1>{payment.mucDichThanhToan}</h1>
                            </div>

                            <span className={`payment-detail-status status-${payment.trangThai}`}>
                                {getStatusText(payment.trangThai)}
                            </span>
                        </div>

                        <div className="payment-detail-amount-box">
                            <span>Số tiền đã thanh toán</span>
                            <strong>{formatMoney(payment.soTien)}</strong>
                        </div>

                        <div className="payment-detail-section">
                            <h2>Thông tin giao dịch</h2>

                            <div className="payment-detail-grid">
                                <Info label="Mã giao dịch" value={payment.maGiaoDich} />
                                <Info label="Mã hóa đơn" value={payment.maHoaDon} />
                                <Info label="Mã chi tiết thanh toán" value={payment.maChiTietThanhToan} />
                                <Info label="Phương thức" value={payment.phuongThucThanhToan} />
                                <Info label="Ngày tạo" value={payment.ngayTao} />
                                <Info label="Nội dung" value={payment.noiDung} />
                            </div>
                        </div>

                        <div className="payment-detail-section">
                            <h2>Thông tin căn hộ / bài đăng</h2>

                            <div className="payment-detail-apartment">
                                <h3>{payment.tieuDeBaiDang}</h3>
                                <p>{payment.diaChi}</p>

                                <div className="payment-detail-grid">
                                    <Info label="Mã bài đăng" value={payment.maBaiDang} />
                                    <Info label="Ngày bắt đầu" value={payment.ngayBatDau} />
                                    <Info label="Ngày kết thúc" value={payment.ngayKetThuc} />
                                </div>
                            </div>
                        </div>

                        <div className="payment-detail-section">
                            <h2>Thông tin người thanh toán</h2>

                            <div className="payment-detail-grid">
                                <Info label="Người thanh toán" value={payment.nguoiThanhToan} />
                                <Info label="Người nhận" value={payment.nguoiNhan} />
                            </div>
                        </div>

                        <div className="payment-detail-section">
                            <h2>Ghi chú</h2>
                            <p className="payment-detail-note">{payment.ghiChu}</p>
                        </div>

                        <div className="payment-detail-signature">
                            <div>
                                <strong>Người thanh toán</strong>
                                <span>Ký và ghi rõ họ tên</span>
                            </div>

                            <div>
                                <strong>Người nhận</strong>
                                <span>Ký và ghi rõ họ tên</span>
                            </div>
                        </div>
                    </section>

                    <aside className="payment-detail-side-card">
                        <h2>Tóm tắt</h2>

                        <div className="payment-detail-summary-item">
                            <span>Người thanh toán</span>
                            <strong>{payment.nguoiThanhToan}</strong>
                        </div>

                        <div className="payment-detail-summary-item">
                            <span>Người nhận</span>
                            <strong>{payment.nguoiNhan}</strong>
                        </div>

                        <div className="payment-detail-summary-item">
                            <span>Mục đích</span>
                            <strong>{payment.mucDichThanhToan}</strong>
                        </div>

                        <div className="payment-detail-summary-total">
                            <span>Tổng tiền</span>
                            <strong>{formatMoney(payment.soTien)}</strong>
                        </div>

                        <button
                            type="button"
                            className="payment-detail-primary-btn"
                            onClick={handlePrintInvoice}
                            disabled={payment.trangThai !== "THANH_CONG"}
                        >
                            {payment.trangThai === "THANH_CONG"
                                ? "In hóa đơn"
                                : "Chưa thể in"}
                        </button>
                        {payment.trangThai !== "THANH_CONG" && (
                            <p className="payment-warning">
                                Giao dịch chưa thành công, chưa thể in hóa đơn.
                            </p>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

const Info = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="payment-detail-info">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
};

export default PaymentDetail;