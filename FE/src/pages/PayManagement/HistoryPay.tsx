import { useEffect, useMemo, useState } from "react";
import "./HistoryPay.css";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Tag, Table, Button, Card, Descriptions, Modal, Space, message } from "antd";
import Navbar from "../../components/layout/Navbar/navbar";
import { getHoaDonByNguoiDung } from "../../services/api/PostManagementService";
import type { HoaDonDTO } from "../../services/api/PostManagementService";
import { openInvoicePrintWindow } from "../../utils/invoicePrint";
import type { InvoicePrintRow } from "../../utils/invoicePrint";

type PackageRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

type TransactionRow = {
  id: string;
  invoiceId: string;
  time: string;
  type: string;
  amount: number;
  transferCode: string;
  note: string;
  status: string;
  invoice: HoaDonDTO;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeStatus = (status?: string | null) => status?.toUpperCase() ?? "";

const getPaymentStatusLabel = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case "SUCCESS":
      return "Thành công";
    case "PENDING":
      return "Chờ thanh toán";
    case "FAILED":
      return "Thất bại";
    default:
      return status || "-";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Thành công":
      return "green";
    case "Chờ thanh toán":
      return "orange";
    case "Thất bại":
      return "red";
    default:
      return "default";
  }
};

const isInvoicePrintable = (invoice: HoaDonDTO) =>
  normalizeStatus(invoice.trangThaiThanhToan) === "SUCCESS";

const getPackageStatusColor = (status: string) => {
  switch (status) {
    case "Đang hoạt động":
    case "Đã thanh toán":
      return "green";
    case "Chờ thanh toán":
      return "orange";
    case "Hết hạn":
    case "Thất bại":
      return "red";
    default:
      return "default";
  }
};

const getInvoiceTypeLabel = (type?: string | null) => {
  switch (normalizeStatus(type)) {
    case "DANG_BAI":
      return "Mua gói đăng bài";
    case "THUE_CAN_HO":
      return "Thanh toán thuê căn hộ";
    default:
      return type || "-";
  }
};

const getPackageStatusLabel = (invoice: HoaDonDTO) => {
  const paymentStatus = normalizeStatus(invoice.trangThaiThanhToan);
  const effectiveStatus = normalizeStatus(invoice.trangThaiHieuLuc);
  const endDate = invoice.ngayKetThuc ? new Date(invoice.ngayKetThuc) : null;

  if (paymentStatus === "FAILED") return "Thất bại";
  if (paymentStatus === "PENDING") return "Chờ thanh toán";
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
    return "Hết hạn";
  }
  if (paymentStatus === "SUCCESS" && effectiveStatus === "DANG_HIEU_LUC") {
    return "Đang hoạt động";
  }
  if (paymentStatus === "SUCCESS") return "Đã thanh toán";

  return invoice.trangThaiHieuLuc || invoice.trangThaiThanhToan || "-";
};

const sortInvoicesByLatest = (items: HoaDonDTO[]) => {
  const getInvoiceTime = (invoice: HoaDonDTO) => {
    const time = new Date(invoice.ngayThanhToan || invoice.ngayTao || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  return [...items].sort((a, b) => {
    return getInvoiceTime(b) - getInvoiceTime(a);
  });
};

const History = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'recharge';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [invoices, setInvoices] = useState<HoaDonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<HoaDonDTO | null>(null);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'recharge');
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      const maNguoiDung = localStorage.getItem("userId");

      if (!maNguoiDung) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setInvoices([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getHoaDonByNguoiDung(maNguoiDung);

        if (isMounted) {
          setInvoices(sortInvoicesByLatest(data));
        }
      } catch (err) {
        console.error("Load payment history failed:", err);
        if (isMounted) {
          setError("Không tải được lịch sử thanh toán. Vui lòng thử lại sau.");
          setInvoices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleExportInvoice = (invoice: HoaDonDTO) => {
    if (!isInvoicePrintable(invoice)) {
      message.warning("Chỉ có thể in hóa đơn khi giao dịch thành công");
      return;
    }

    const invoiceTitle =
      normalizeStatus(invoice.loaiHoaDon) === "DANG_BAI"
        ? "Hóa đơn thanh toán bài đăng"
        : "Hóa đơn giao dịch";
    const invoiceRows: InvoicePrintRow[] = [
      ["Mã hóa đơn", invoice.maHoaDon],
      ["Loại giao dịch", getInvoiceTypeLabel(invoice.loaiHoaDon)],
      ["Số tiền", `${(invoice.soTien || 0).toLocaleString("vi-VN")} đ`],
      ["Trạng thái thanh toán", getPaymentStatusLabel(invoice.trangThaiThanhToan)],
      ["Trạng thái hiệu lực", invoice.trangThaiHieuLuc || "-"],
      ["Mã chuyển khoản", invoice.noiDungChuyenKhoan || "-"],
      ["Ghi chú", invoice.ghiChu || "-"],
      ["Ngày tạo", formatDateTime(invoice.ngayTao)],
      ["Ngày thanh toán", formatDateTime(invoice.ngayThanhToan)],
      ["Ngày bắt đầu", formatDateTime(invoice.ngayBatDau)],
      ["Ngày kết thúc", formatDateTime(invoice.ngayKetThuc)],
    ];

    const didOpen = openInvoicePrintWindow({
      title: invoiceTitle,
      documentTitle: `${invoiceTitle} ${invoice.maHoaDon}`,
      generatedAt: formatDateTime(new Date().toISOString()),
      rows: invoiceRows,
      footer: "Hóa đơn được xuất từ hệ thống quản lý tài chính người cho thuê.",
      signerLabel: "Chữ ký người cho thuê",
    });

    if (!didOpen) {
      message.error("Trình duyệt đang chặn cửa sổ xuất hóa đơn");
    }
  };

  const packageColumns = [
    { title: "Tên gói", dataIndex: "name", key: "name" },
    { title: "Ngày kích hoạt", dataIndex: "startDate", key: "startDate" },
    { title: "Ngày hết hạn", dataIndex: "endDate", key: "endDate" },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status: string) => (
        <Tag color={getPackageStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: () => (
        <Link to="/payment/all">
          <Button type="link">Gia hạn</Button>
        </Link>
      )
    }
  ];

  const packagesData = useMemo<PackageRow[]>(() => {
    return invoices
      .filter((invoice) => normalizeStatus(invoice.loaiHoaDon) === "DANG_BAI")
      .map((invoice) => ({
        id: invoice.maHoaDon,
        name: invoice.ghiChu || "Gói đăng bài 1 tháng",
        startDate: formatDate(invoice.ngayBatDau),
        endDate: formatDate(invoice.ngayKetThuc),
        status: getPackageStatusLabel(invoice),
      }));
  }, [invoices]);

  const transactionColumns = [
    { title: "Thời gian", dataIndex: "time", key: "time" },
    { title: "Mã hóa đơn", dataIndex: "invoiceId", key: "invoiceId" },
    { title: "Loại", dataIndex: "type", key: "type" },
    { 
      title: "Số tiền", 
      dataIndex: "amount", 
      key: "amount",
      render: (v: number) => <span style={{ color: v > 0 ? "#52c41a" : "#ff4d4f" }}>{v.toLocaleString()} đ</span>
    },
    {
      title: "Mã CK / Ghi chú",
      key: "reference",
      render: (_: unknown, record: TransactionRow) => (
        <div>
          <div>{record.transferCode}</div>
          {record.note !== "-" && (
            <div style={{ color: "#6b7280", fontSize: 12 }}>{record.note}</div>
          )}
        </div>
      ),
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: unknown, record: TransactionRow) => (
        <Space>
          <Button type="link" onClick={() => setSelectedInvoice(record.invoice)}>
            Chi tiết
          </Button>
          <Button
            type="link"
            disabled={!isInvoicePrintable(record.invoice)}
            onClick={() => handleExportInvoice(record.invoice)}
          >
            In hóa đơn
          </Button>
        </Space>
      ),
    },
  ];

  const transactionData = useMemo<TransactionRow[]>(() => {
    return invoices.map((invoice) => ({
      id: invoice.maHoaDon,
      invoiceId: invoice.maHoaDon,
      time: formatDateTime(invoice.ngayThanhToan || invoice.ngayTao),
      type: getInvoiceTypeLabel(invoice.loaiHoaDon),
      amount: -Math.abs(invoice.soTien || 0),
      transferCode: invoice.noiDungChuyenKhoan || invoice.maHoaDon,
      note: invoice.ghiChu || "-",
      status: getPaymentStatusLabel(invoice.trangThaiThanhToan),
      invoice,
    }));
  }, [invoices]);

  return (
    <>
      <div className="main-layout">
        <Navbar />
        <div className="content-area">
          <main className="history-content">
            <div className="history-header">
              <h1>Quản lý tài chính</h1>
              <Link to="/payment/all">
                <Button type="primary" size="large">Mua gói tin ngay</Button>
              </Link>
            </div>

            <nav className="history-tabs">
              <button
                className={`tab-btn ${activeTab === "recharge" ? "active" : ""}`}
                onClick={() => handleTabChange("recharge")}
              >
                Mua gói mới
              </button>
              <button
                className={`tab-btn ${activeTab === "package" ? "active" : ""}`}
                onClick={() => handleTabChange("package")}
              >
                Quản lý gói nạp
              </button>
              <button
                className={`tab-btn ${activeTab === "transaction" ? "active" : ""}`}
                onClick={() => handleTabChange("transaction")}
              >
                Lịch sử giao dịch
              </button>
            </nav>

            <div className="container">
              <div className="history-wrapper">
                {error && (
                  <Alert
                    type="error"
                    showIcon
                    message={error}
                    style={{ marginBottom: 16 }}
                  />
                )}

                {activeTab === "recharge" && (
                  <div className="recharge-section" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="history-note" style={{ maxWidth: 600, margin: '0 auto 30px' }}>
                      <strong>Mua gói dịch vụ mới</strong>
                      <p>Vui lòng chọn gói tin phù hợp từ bảng giá dịch vụ để thực hiện thanh toán và kích hoạt tin đăng.</p>
                    </div>
                    <Link to="/payment/all">
                      <Button type="primary" size="large" style={{ height: 50, padding: '0 40px', fontSize: 18 }}>
                        Xem bảng giá & Mua gói ngay
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "package" && (
                  <div className="package-section">
                    <h2>Gói tin của bạn</h2>
                    <Table 
                      columns={packageColumns} 
                      dataSource={packagesData} 
                      rowKey="id" 
                      loading={loading}
                      pagination={false}
                      locale={{ emptyText: "Chưa có gói đăng bài nào" }}
                    />
                    <div style={{ marginTop: 24 }}>
                      <Card title="Hướng dẫn sử dụng gói tin">
                        <p>1. Chọn gói tin phù hợp với nhu cầu hiển thị của bạn.</p>
                        <p>2. Sau khi mua, gói tin sẽ được cộng vào tài khoản và có thể áp dụng khi đăng tin mới.</p>
                        <p>3. Bạn có thể gia hạn gói tin bất cứ lúc nào để duy trì vị trí hiển thị.</p>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "transaction" && (
                  <div className="transaction-section">
                    <h2>Lịch sử giao dịch</h2>
                    <Table 
                      columns={transactionColumns} 
                      dataSource={transactionData} 
                      rowKey="id"
                      loading={loading}
                      locale={{ emptyText: "Chưa có giao dịch nào" }}
                      scroll={{ x: 960 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Modal
        title="Chi tiết hóa đơn"
        open={Boolean(selectedInvoice)}
        onCancel={() => setSelectedInvoice(null)}
        footer={
          selectedInvoice
            ? [
                <Button key="close" onClick={() => setSelectedInvoice(null)}>
                  Đóng
                </Button>,
                <Button
                  key="export"
                  type="primary"
                  disabled={!isInvoicePrintable(selectedInvoice)}
                  onClick={() => handleExportInvoice(selectedInvoice)}
                >
                  In hóa đơn
                </Button>,
              ]
            : null
        }
      >
        {selectedInvoice && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Mã hóa đơn">
              {selectedInvoice.maHoaDon}
            </Descriptions.Item>
            <Descriptions.Item label="Loại giao dịch">
              {getInvoiceTypeLabel(selectedInvoice.loaiHoaDon)}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              {(selectedInvoice.soTien || 0).toLocaleString("vi-VN")} đ
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái thanh toán">
              <Tag color={getPaymentStatusColor(getPaymentStatusLabel(selectedInvoice.trangThaiThanhToan))}>
                {getPaymentStatusLabel(selectedInvoice.trangThaiThanhToan)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hiệu lực">
              {selectedInvoice.trangThaiHieuLuc || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã chuyển khoản">
              {selectedInvoice.noiDungChuyenKhoan || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedInvoice.ghiChu || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDateTime(selectedInvoice.ngayTao)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {formatDateTime(selectedInvoice.ngayThanhToan)}
            </Descriptions.Item>
            <Descriptions.Item label="Hiệu lực">
              {formatDate(selectedInvoice.ngayBatDau)} - {formatDate(selectedInvoice.ngayKetThuc)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default History;
