import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import {
  BankOutlined,
  DownloadOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SendOutlined,
  WalletOutlined,
} from "@ant-design/icons";

import Navbar from "../../components/layout/Navbar/navbar";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import {
  createWithdrawRequest,
  getLandlordWallet,
  getWalletTransactions,
  getWithdrawRequestsByLandlord,
  type GiaoDichViDTO,
  type ViNguoiChoThueDTO,
  type YeuCauRutTienDTO,
} from "../../services/api/WalletService";
import {
  getWithdrawStatusLabel,
  isWithdrawPrintable,
  openWithdrawPrintWindow,
} from "../../utils/withdrawPrint";
import "./LandlordWalletPage.css";

type WithdrawFormValues = {
  bankCode: string;
  bankAccount: string;
  accountName: string;
  soTien: number;
};

const safeNumber = (value?: number | null) => value ?? 0;

const normalizeStatus = (value?: string | null) => value?.trim().toUpperCase() || "";

const getTransactionLabel = (type?: string | null) => {
  switch (normalizeStatus(type)) {
    case "RENT_REVENUE":
      return "Doanh thu thuê căn hộ";
    case "WITHDRAW_REQUEST":
      return "Tạo yêu cầu rút tiền";
    case "WITHDRAW_SUCCESS":
    case "WITHDRAW_APPROVED":
      return "Rút tiền thành công";
    case "WITHDRAW_REJECTED":
      return "Hoàn tiền yêu cầu bị từ chối";
    default:
      return type || "-";
  }
};

const getWithdrawStatusColor = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case "SUCCESS":
      return "green";
    case "PENDING":
      return "orange";
    case "REJECTED":
      return "red";
    default:
      return "default";
  }
};

const getAmountClass = (value?: number | null) => {
  const amount = safeNumber(value);
  if (amount > 0) return "landlord-wallet-money landlord-wallet-money--positive";
  if (amount < 0) return "landlord-wallet-money landlord-wallet-money--negative";
  return "landlord-wallet-money";
};

const LandlordWalletPage = () => {
  const { user } = useAuth();
  const maNguoiDung = user?.maNguoiDung || localStorage.getItem("userId") || "";
  const [form] = Form.useForm<WithdrawFormValues>();

  const [wallet, setWallet] = useState<ViNguoiChoThueDTO | null>(null);
  const [transactions, setTransactions] = useState<GiaoDichViDTO[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<YeuCauRutTienDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    if (!maNguoiDung) {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      setWallet(null);
      setTransactions([]);
      setWithdrawRequests([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [walletData, transactionData, withdrawData] = await Promise.all([
        getLandlordWallet(maNguoiDung),
        getWalletTransactions(maNguoiDung),
        getWithdrawRequestsByLandlord(maNguoiDung),
      ]);

      setWallet(walletData);
      setTransactions(transactionData);
      setWithdrawRequests(withdrawData);
    } catch (err) {
      console.error("Load wallet failed:", err);
      setError("Không tải được dữ liệu ví người cho thuê.");
    } finally {
      setLoading(false);
    }
  }, [maNguoiDung]);

  useEffect(() => {
    void loadWalletData();
  }, [loadWalletData]);

  const handleCreateWithdraw = async (values: WithdrawFormValues) => {
    if (!maNguoiDung) {
      message.error("Không tìm thấy thông tin người dùng");
      return;
    }

    const soTien = Number(values.soTien || 0);
    const soDuKhaDung = safeNumber(wallet?.soDuKhaDung);

    if (soTien <= 0) {
      message.error("Số tiền rút phải lớn hơn 0");
      return;
    }

    if (soTien > soDuKhaDung) {
      message.error("Số tiền rút vượt quá số dư khả dụng");
      return;
    }

    try {
      setSubmitting(true);
      await createWithdrawRequest({
        maNguoiDung,
        bankCode: values.bankCode.trim(),
        bankAccount: values.bankAccount.trim(),
        accountName: values.accountName.trim(),
        soTien,
      });

      message.success("Đã tạo yêu cầu rút tiền");
      form.resetFields();
      await loadWalletData();
    } catch (err) {
      console.error("Create withdraw failed:", err);
      message.error("Không tạo được yêu cầu rút tiền");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintWithdraw = (request: YeuCauRutTienDTO) => {
    if (!isWithdrawPrintable(request)) {
      message.warning("Chỉ có thể in phiếu khi yêu cầu rút tiền thành công");
      return;
    }

    const didOpen = openWithdrawPrintWindow(request, "Chữ ký người cho thuê");
    if (!didOpen) {
      message.error("Trình duyệt đang chặn cửa sổ in phiếu");
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        key: "available",
        label: "Số dư khả dụng",
        value: formatCurrency(safeNumber(wallet?.soDuKhaDung)),
        note: "Có thể tạo yêu cầu rút",
        icon: <WalletOutlined />,
      },
      {
        key: "pending",
        label: "Số dư chờ rút",
        value: formatCurrency(safeNumber(wallet?.soDuChoRut)),
        note: "Đang chờ admin xử lý",
        icon: <FieldTimeOutlined />,
      },
      {
        key: "revenue",
        label: "Tổng doanh thu",
        value: formatCurrency(safeNumber(wallet?.tongDoanhThu)),
        note: "Từ hóa đơn thuê thành công",
        icon: <HistoryOutlined />,
      },
    ],
    [wallet],
  );

  const transactionColumns: TableProps<GiaoDichViDTO>["columns"] = [
    {
      title: "Thời gian",
      dataIndex: "ngayTao",
      key: "ngayTao",
      width: 170,
      render: (value?: string | null) => formatDate(value || undefined),
    },
    {
      title: "Loại giao dịch",
      dataIndex: "loaiGiaoDich",
      key: "loaiGiaoDich",
      render: (value?: string | null) => <strong>{getTransactionLabel(value)}</strong>,
    },
    {
      title: "Hóa đơn",
      dataIndex: "maHoaDon",
      key: "maHoaDon",
      width: 150,
      render: (value?: string | null) => value || "-",
    },
    {
      title: "Số tiền",
      dataIndex: "soTien",
      key: "soTien",
      align: "right",
      width: 160,
      render: (value?: number | null) => (
        <span className={getAmountClass(value)}>{formatCurrency(safeNumber(value))}</span>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "noiDung",
      key: "noiDung",
      render: (value?: string | null) => value || "-",
    },
  ];

  const withdrawColumns: TableProps<YeuCauRutTienDTO>["columns"] = [
    {
      title: "Mã yêu cầu",
      dataIndex: "maYeuCauRutTien",
      key: "maYeuCauRutTien",
      width: 150,
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: "Ngân hàng",
      key: "bank",
      render: (_value, record) => (
        <div className="landlord-wallet-bank-cell">
          <strong>{record.bankCode || "-"}</strong>
          <span>{record.bankAccount || "-"}</span>
          <span>{record.accountName || "-"}</span>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "soTien",
      key: "soTien",
      align: "right",
      width: 160,
      render: (value?: number | null) => (
        <span className="landlord-wallet-money">{formatCurrency(safeNumber(value))}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      width: 130,
      render: (value?: string | null) => (
        <Tag color={getWithdrawStatusColor(value)}>{getWithdrawStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngayTao",
      key: "ngayTao",
      width: 170,
      render: (value?: string | null) => formatDate(value || undefined),
    },
    {
      title: "Ngày xử lý",
      dataIndex: "ngayXuLy",
      key: "ngayXuLy",
      width: 170,
      render: (value?: string | null) => formatDate(value || undefined),
    },
    {
      title: "Phiếu",
      key: "print",
      width: 120,
      render: (_value, record) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          disabled={!isWithdrawPrintable(record)}
          onClick={() => handlePrintWithdraw(record)}
        >
          In phiếu
        </Button>
      ),
    },
  ];

  return (
    <div className="landlord-wallet-page">
      <Navbar />

      <main className="landlord-wallet-content">
        <section className="landlord-wallet-header">
          <div>
            <p className="landlord-wallet-eyebrow">Ví người cho thuê</p>
            <h1>Quản lý số dư và rút tiền</h1>
            <span>
              Theo dõi doanh thu thuê căn hộ, yêu cầu rút tiền và chứng từ đã xử lý.
            </span>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadWalletData()}
          >
            Làm mới
          </Button>
        </section>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            className="landlord-wallet-alert"
          />
        )}

        <section className="landlord-wallet-kpis" aria-label="Tổng quan ví">
          {summaryCards.map((item) => (
            <article key={item.key} className={`landlord-wallet-kpi ${item.key}`}>
              <div className="landlord-wallet-kpi__icon">{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="landlord-wallet-grid">
          <div className="landlord-wallet-panel">
            <div className="landlord-wallet-panel__header">
              <div>
                <h2>Tạo yêu cầu rút tiền</h2>
                <p>Số tiền sẽ chuyển từ khả dụng sang chờ rút sau khi gửi yêu cầu.</p>
              </div>
              <BankOutlined />
            </div>

            <Form
              form={form}
              layout="vertical"
              className="landlord-wallet-form"
              onFinish={handleCreateWithdraw}
            >
              <Form.Item
                name="bankCode"
                label="Ngân hàng"
                rules={[{ required: true, message: "Vui lòng nhập ngân hàng" }]}
              >
                <Input placeholder="VD: VCB, ACB, MB..." />
              </Form.Item>

              <Form.Item
                name="bankAccount"
                label="Số tài khoản"
                rules={[{ required: true, message: "Vui lòng nhập số tài khoản" }]}
              >
                <Input placeholder="Nhập số tài khoản nhận tiền" />
              </Form.Item>

              <Form.Item
                name="accountName"
                label="Chủ tài khoản"
                rules={[{ required: true, message: "Vui lòng nhập chủ tài khoản" }]}
              >
                <Input placeholder="Tên chủ tài khoản" />
              </Form.Item>

              <Form.Item
                name="soTien"
                label="Số tiền muốn rút"
                rules={[
                  { required: true, message: "Vui lòng nhập số tiền" },
                  {
                    validator: (_, value?: number) => {
                      if (!value || value <= 0) {
                        return Promise.reject(new Error("Số tiền phải lớn hơn 0"));
                      }

                      if (value > safeNumber(wallet?.soDuKhaDung)) {
                        return Promise.reject(new Error("Không được rút quá số dư khả dụng"));
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber<number>
                  min={1000}
                  step={100000}
                  controls={false}
                  formatter={(value) =>
                    value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
                  }
                  parser={(value) => Number((value || "").replace(/\./g, ""))}
                  addonAfter="VND"
                  placeholder="Nhập số tiền"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
                block
              >
                Gửi yêu cầu rút tiền
              </Button>
            </Form>
          </div>

          <div className="landlord-wallet-panel">
            <div className="landlord-wallet-panel__header">
              <div>
                <h2>Lịch sử giao dịch ví</h2>
                <p>Các biến động doanh thu, yêu cầu rút tiền và hoàn tiền.</p>
              </div>
              <HistoryOutlined />
            </div>

            <Table
              rowKey="maGiaoDichVi"
              columns={transactionColumns}
              dataSource={transactions}
              loading={loading}
              pagination={{ pageSize: 5, showSizeChanger: false }}
              scroll={{ x: 860 }}
              locale={{ emptyText: <Empty description="Chưa có giao dịch ví" /> }}
            />
          </div>
        </section>

        <section className="landlord-wallet-panel landlord-wallet-panel--wide">
          <div className="landlord-wallet-panel__header">
            <div>
              <h2>Lịch sử yêu cầu rút tiền</h2>
              <p>Phiếu rút tiền chỉ in được sau khi admin xác nhận chuyển khoản.</p>
            </div>
          </div>

          <Table
            rowKey="maYeuCauRutTien"
            columns={withdrawColumns}
            dataSource={withdrawRequests}
            loading={loading}
            pagination={{ pageSize: 6, showSizeChanger: false }}
            scroll={{ x: 980 }}
            locale={{ emptyText: <Empty description="Chưa có yêu cầu rút tiền" /> }}
          />
        </section>
      </main>
    </div>
  );
};

export default LandlordWalletPage;
