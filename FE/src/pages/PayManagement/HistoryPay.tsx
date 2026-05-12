import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Spin, Tag, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./HistoryPay.css";
import Navbar from "../../components/layout/Navbar/navbar";
import { useAuth } from "../../hooks/useAuth";
import {
  formatPaymentMoney,
  getInvoicesByUser,
  type HoaDonDTO,
} from "../../services/api/PaymentService";

const getPaymentStatusText = (status?: string | null) => {
  switch (status) {
    case "SUCCESS":
      return "Thành công";
    case "PENDING":
      return "Chờ thanh toán";
    case "FAILED":
      return "Thất bại";
    default:
      return status || "Chưa xác định";
  }
};

const getEffectStatusText = (status?: string | null) => {
  switch (status) {
    case "DANG_HIEU_LUC":
      return "Đang hiệu lực";
    case "CHUA_HIEU_LUC":
      return "Chưa hiệu lực";
    case "HET_HIEU_LUC":
      return "Hết hiệu lực";
    default:
      return status || "Chưa xác định";
  }
};

const getInvoiceTypeText = (type?: string | null) => {
  switch (type) {
    case "DANG_BAI":
      return "Kích hoạt bài đăng";
    case "THUE_CAN_HO":
      return "Thanh toán thuê căn hộ";
    default:
      return type || "Giao dịch";
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<HoaDonDTO[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!user?.maNguoiDung) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getInvoicesByUser(user.maNguoiDung);
        setInvoices(
          data
            .slice()
            .sort(
              (a, b) =>
                new Date(b.ngayTao || "").getTime() -
                new Date(a.ngayTao || "").getTime()
            )
        );
      } catch (error) {
        console.error(error);
        message.error("Không tải được danh sách giao dịch");
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [user?.maNguoiDung]);

  const filteredInvoices = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchStatus =
        status === "ALL" ? true : invoice.trangThaiThanhToan === status;

      const matchKeyword = [
        invoice.maHoaDon,
        invoice.maBaiDang,
        invoice.loaiHoaDon,
        invoice.noiDungChuyenKhoan,
        invoice.ghiChu,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText);

      return matchStatus && matchKeyword;
    });
  }, [invoices, keyword, status]);

  const totalSuccess = invoices
    .filter((invoice) => invoice.trangThaiThanhToan === "SUCCESS")
    .reduce((sum, invoice) => sum + (invoice.soTien || 0), 0);

  const pendingCount = invoices.filter(
    (invoice) => invoice.trangThaiThanhToan === "PENDING"
  ).length;

  return (
    <div className="main-layout">
      <Navbar />

      <main className="history-content">
        <section className="history-page-header">
          <div>
            <p>Thanh toán bài đăng</p>
            <h1>Quản lý giao dịch</h1>
          </div>

          <Button type="primary" onClick={() => navigate("/recharge/packages")}>
            Quản lý gói nạp
          </Button>
        </section>

        <section className="history-stats-grid">
          <div className="history-stat-card">
            <span>Tổng giao dịch</span>
            <strong>{invoices.length}</strong>
          </div>
          <div className="history-stat-card">
            <span>Chờ thanh toán</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="history-stat-card">
            <span>Đã thanh toán</span>
            <strong>{formatPaymentMoney(totalSuccess)}</strong>
          </div>
        </section>

        <section className="history-toolbar">
          <Input
            value={keyword}
            placeholder="Tìm theo mã hóa đơn, bài đăng, nội dung chuyển khoản"
            onChange={(event) => setKeyword(event.target.value)}
          />

          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "PENDING", label: "Chờ thanh toán" },
              { value: "SUCCESS", label: "Thành công" },
              { value: "FAILED", label: "Thất bại" },
            ]}
          />
        </section>

        <section className="history-table-card">
          <div className="history-table-card__head">
            <div>
              <h2>Danh sách giao dịch</h2>
              <p>Giao dịch được lấy từ hóa đơn thanh toán của tài khoản hiện tại.</p>
            </div>
            <Tag color="blue">{filteredInvoices.length} giao dịch</Tag>
          </div>

          {loading ? (
            <div className="history-loading">
              <Spin /> Đang tải giao dịch
            </div>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Mã hóa đơn</th>
                    <th>Mã bài đăng</th>
                    <th>Loại giao dịch</th>
                    <th>Số tiền</th>
                    <th>Thanh toán</th>
                    <th>Hiệu lực</th>
                    <th>Ngày tạo</th>
                    <th>Ngày thanh toán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.maHoaDon}>
                      <td>
                        <strong>{invoice.maHoaDon}</strong>
                        <span>{invoice.noiDungChuyenKhoan || "Chưa có nội dung CK"}</span>
                      </td>
                      <td>{invoice.maBaiDang || "Không có"}</td>
                      <td>{getInvoiceTypeText(invoice.loaiHoaDon)}</td>
                      <td className="history-money">
                        {formatPaymentMoney(invoice.soTien)}
                      </td>
                      <td>
                        <Tag
                          color={
                            invoice.trangThaiThanhToan === "SUCCESS"
                              ? "green"
                              : invoice.trangThaiThanhToan === "FAILED"
                              ? "red"
                              : "gold"
                          }
                        >
                          {getPaymentStatusText(invoice.trangThaiThanhToan)}
                        </Tag>
                      </td>
                      <td>{getEffectStatusText(invoice.trangThaiHieuLuc)}</td>
                      <td>{formatDateTime(invoice.ngayTao)}</td>
                      <td>{formatDateTime(invoice.ngayThanhToan)}</td>
                      <td>
                        {invoice.trangThaiThanhToan === "PENDING" &&
                        invoice.maBaiDang ? (
                          <Button
                            size="small"
                            onClick={() => navigate(`/payment/${invoice.maBaiDang}`)}
                          >
                            Thanh toán tiếp
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => navigate("/list-post")}>
                            Xem bài đăng
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="history-empty-cell">
                        Không có giao dịch phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default History;
