import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";

import AdminPagination from "../components/AdminPagination";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import {
  approveWithdrawRequest,
  getAllWithdrawRequests,
  rejectWithdrawRequest,
  type YeuCauRutTienDTO,
} from "../../../services/api/WalletService";
import {
  getWithdrawStatusLabel,
  isWithdrawPrintable,
  normalizeWithdrawStatus,
  openWithdrawPrintWindow,
} from "../../../utils/withdrawPrint";
import "./admin-withdraw-management.css";

const safeNumber = (value?: number | null) => value ?? 0;

const isPending = (status?: string | null) => normalizeWithdrawStatus(status) === "PENDING";

const getStatusColor = (status?: string | null) => {
  switch (normalizeWithdrawStatus(status)) {
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

const AdminWithdrawManagement = () => {
  const [requests, setRequests] = useState<YeuCauRutTienDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllWithdrawRequests();
      setRequests(data);
    } catch (err) {
      console.error("Load withdraw requests failed:", err);
      message.error("Không tải được danh sách yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter]);

  const filteredRequests = useMemo(() => {
    const cleanKeyword = keyword.trim().toLowerCase();

    return requests.filter((item) => {
      const haystack = [
        item.maYeuCauRutTien,
        item.maVi,
        item.maNguoiDung || "",
        item.tenNguoiDung || "",
        item.emailNguoiDung || "",
        item.soDienThoaiNguoiDung || "",
        item.bankCode || "",
        item.bankAccount || "",
        item.accountName || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword = !cleanKeyword || haystack.includes(cleanKeyword);
      const matchStatus =
        statusFilter === "ALL" || normalizeWithdrawStatus(item.trangThai) === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [keyword, requests, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRequests.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRequests, pageSize]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => isPending(item.trangThai));
    const success = requests.filter((item) => normalizeWithdrawStatus(item.trangThai) === "SUCCESS");
    const rejected = requests.filter((item) => normalizeWithdrawStatus(item.trangThai) === "REJECTED");

    return {
      total: requests.length,
      pending: pending.length,
      success: success.length,
      rejected: rejected.length,
      pendingAmount: pending.reduce((sum, item) => sum + safeNumber(item.soTien), 0),
    };
  }, [requests]);

  const handleApprove = (request: YeuCauRutTienDTO) => {
    if (!isPending(request.trangThai)) {
      message.warning("Chỉ xử lý yêu cầu đang chờ");
      return;
    }

    Modal.confirm({
      title: "Xác nhận đã chuyển khoản?",
      content: `Yêu cầu ${request.maYeuCauRutTien} sẽ chuyển sang trạng thái thành công.`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setProcessingId(request.maYeuCauRutTien);
          await approveWithdrawRequest(request.maYeuCauRutTien);
          message.success("Đã xác nhận chuyển khoản");
          await loadRequests();
        } catch (err) {
          console.error("Approve withdraw failed:", err);
          message.error("Không xác nhận được yêu cầu rút tiền");
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const handleReject = (request: YeuCauRutTienDTO) => {
    if (!isPending(request.trangThai)) {
      message.warning("Chỉ xử lý yêu cầu đang chờ");
      return;
    }

    Modal.confirm({
      title: "Từ chối yêu cầu rút tiền?",
      content: `Số tiền ${formatCurrency(safeNumber(request.soTien))} sẽ được hoàn về số dư khả dụng.`,
      okText: "Từ chối",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setProcessingId(request.maYeuCauRutTien);
          await rejectWithdrawRequest(request.maYeuCauRutTien);
          message.success("Đã từ chối và hoàn tiền về ví");
          await loadRequests();
        } catch (err) {
          console.error("Reject withdraw failed:", err);
          message.error("Không từ chối được yêu cầu rút tiền");
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const handlePrint = (request: YeuCauRutTienDTO) => {
    if (!isWithdrawPrintable(request)) {
      message.warning("Chỉ in phiếu rút tiền khi yêu cầu thành công");
      return;
    }

    const didOpen = openWithdrawPrintWindow(request, "Chữ ký admin");
    if (!didOpen) {
      message.error("Trình duyệt đang chặn cửa sổ in phiếu");
    }
  };

  const columns: TableProps<YeuCauRutTienDTO>["columns"] = [
    {
      title: "Yêu cầu",
      dataIndex: "maYeuCauRutTien",
      key: "maYeuCauRutTien",
      width: 160,
      render: (value: string, record) => (
        <div className="admin-withdraw-request-cell">
          <strong>{value}</strong>
          <span>{formatDate(record.ngayTao || undefined)}</span>
        </div>
      ),
    },
    {
      title: "Người cho thuê",
      key: "landlord",
      render: (_value, record) => (
        <div className="admin-withdraw-user-cell">
          <strong>{record.tenNguoiDung || record.maNguoiDung || "-"}</strong>
          <span>{record.emailNguoiDung || "-"}</span>
          <span>{record.soDienThoaiNguoiDung || "-"}</span>
        </div>
      ),
    },
    {
      title: "Ngân hàng",
      key: "bank",
      render: (_value, record) => (
        <div className="admin-withdraw-bank-cell">
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
        <span className="admin-withdraw-money">{formatCurrency(safeNumber(value))}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      width: 140,
      render: (value?: string | null) => (
        <Tag color={getStatusColor(value)}>{getWithdrawStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "Ngày xử lý",
      dataIndex: "ngayXuLy",
      key: "ngayXuLy",
      width: 170,
      render: (value?: string | null) => formatDate(value || undefined),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 260,
      render: (_value, record) => {
        const pending = isPending(record.trangThai);
        const isProcessing = processingId === record.maYeuCauRutTien;

        return (
          <Space wrap>
            <Button
              size="small"
              type="primary"
              disabled={!pending}
              loading={isProcessing}
              onClick={() => handleApprove(record)}
            >
              Xác nhận
            </Button>
            <Button
              size="small"
              danger
              disabled={!pending}
              loading={isProcessing}
              onClick={() => handleReject(record)}
            >
              Từ chối
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!isWithdrawPrintable(record)}
              onClick={() => handlePrint(record)}
            >
              In
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="admin-withdraw-page">
      <section className="admin-withdraw-hero">
        <div>
          <div className="admin-withdraw-kicker">Ví người cho thuê</div>
          <h2>Quản lý yêu cầu rút tiền</h2>
          <p>
            Kiểm tra thông tin ngân hàng, xác nhận chuyển khoản hoặc từ chối yêu cầu đang chờ xử lý.
          </p>
        </div>

        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void loadRequests()}
        >
          Làm mới
        </Button>
      </section>

      <section className="admin-withdraw-summary-grid">
        <article className="admin-withdraw-summary-card">
          <WalletOutlined />
          <span>Tổng yêu cầu</span>
          <strong>{summary.total.toLocaleString("vi-VN")}</strong>
          <p>Toàn bộ yêu cầu rút tiền</p>
        </article>
        <article className="admin-withdraw-summary-card pending">
          <ClockCircleOutlined />
          <span>Đang chờ</span>
          <strong>{summary.pending.toLocaleString("vi-VN")}</strong>
          <p>{formatCurrency(summary.pendingAmount)}</p>
        </article>
        <article className="admin-withdraw-summary-card success">
          <CheckCircleOutlined />
          <span>Thành công</span>
          <strong>{summary.success.toLocaleString("vi-VN")}</strong>
          <p>Đã xác nhận chuyển khoản</p>
        </article>
        <article className="admin-withdraw-summary-card rejected">
          <CloseCircleOutlined />
          <span>Từ chối</span>
          <strong>{summary.rejected.toLocaleString("vi-VN")}</strong>
          <p>Đã hoàn về ví khả dụng</p>
        </article>
      </section>

      <section className="admin-withdraw-toolbar">
        <div className="admin-withdraw-search">
          <SearchOutlined />
          <Input
            value={keyword}
            placeholder="Tìm mã yêu cầu, chủ ví, ngân hàng..."
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
          />
        </div>

        <Select
          value={statusFilter}
          className="admin-withdraw-filter"
          onChange={setStatusFilter}
          options={[
            { value: "ALL", label: "Tất cả trạng thái" },
            { value: "PENDING", label: "Chờ xử lý" },
            { value: "SUCCESS", label: "Thành công" },
            { value: "REJECTED", label: "Từ chối" },
          ]}
        />
      </section>

      <section className="admin-withdraw-table-card">
        <div className="admin-withdraw-table-card__head">
          <div>
            <h3>Danh sách yêu cầu</h3>
            <p>Chỉ yêu cầu PENDING mới có thể xác nhận hoặc từ chối.</p>
          </div>
          <BankOutlined />
        </div>

        <Table
          rowKey="maYeuCauRutTien"
          columns={columns}
          dataSource={paginatedRequests}
          loading={loading}
          pagination={false}
          scroll={{ x: 1120 }}
          locale={{ emptyText: "Không có yêu cầu rút tiền phù hợp" }}
        />

        {filteredRequests.length > 0 && (
          <div className="admin-withdraw-pagination">
            <AdminPagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredRequests.length}
              itemLabel="yêu cầu"
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminWithdrawManagement;
