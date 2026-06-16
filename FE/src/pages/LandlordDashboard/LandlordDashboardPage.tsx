import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Table,
  Tag,
} from "antd";
import type { TableProps } from "antd";
import {
  BarChartOutlined,
  DollarCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Navbar from "../../components/layout/Navbar/navbar";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import {
  getLandlordDashboard,
  type LandlordDashboardDTO,
  type LandlordPostStatsDTO,
  type LandlordRevenueDTO,
} from "../../services/api/LandlordDashboardService";
import "./LandlordDashboardPage.css";

type RevenuePeriod = "day" | "month" | "year";

const normalizeStatus = (status?: string | null) => status?.trim().toUpperCase() || "";

const safeNumber = (value?: number | null) => value ?? 0;

const getStatusMeta = (status?: string | null) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
    case "APPROVED":
      return { label: "Đang hiển thị", color: "green" };
    case "DA_THUE":
      return { label: "Đã thuê", color: "purple" };
    case "PENDING":
      return { label: "Chờ duyệt", color: "processing" };
    case "REJECTED":
    case "TU_CHOI":
      return { label: "Từ chối", color: "red" };
    case "HIDDEN":
    case "INACTIVE":
    case "BI_AN":
      return { label: "Đã ẩn", color: "default" };
    case "EXPIRED":
    case "HET_HAN":
      return { label: "Hết hạn", color: "orange" };
    default:
      return { label: status || "Không xác định", color: "blue" };
  }
};

const getRevenueDate = (revenue: LandlordRevenueDTO) =>
  revenue.ngayThanhToan || revenue.ngayTao || undefined;

const getDateTimeValue = (value?: string | null) => {
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getRevenueTime = (revenue: LandlordRevenueDTO) =>
  getDateTimeValue(getRevenueDate(revenue));

const revenuePeriodOptions: Array<{ label: string; value: RevenuePeriod }> = [
  { label: "Theo tháng", value: "month" },
  { label: "Theo ngày", value: "day" },
  { label: "Theo năm", value: "year" },
];

const revenuePeriodTitle: Record<RevenuePeriod, string> = {
  day: "Doanh thu theo ngày",
  month: "Doanh thu theo tháng",
  year: "Doanh thu theo năm",
};

const getRevenuePeriodKey = (
  value: string | null | undefined,
  period: RevenuePeriod,
) => {
  if (!value) return { label: "Không rõ", sortTime: 0 };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: "Không rõ", sortTime: 0 };

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (period === "day") {
    return {
      label: `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`,
      sortTime: new Date(year, month, day).getTime(),
    };
  }

  if (period === "year") {
    return {
      label: String(year),
      sortTime: new Date(year, 0, 1).getTime(),
    };
  }

  return {
    label: `${String(month + 1).padStart(2, "0")}/${year}`,
    sortTime: new Date(year, month, 1).getTime(),
  };
};

const LandlordDashboardPage = () => {
  const { user } = useAuth();
  const maNguoiDung = user?.maNguoiDung || localStorage.getItem("userId") || "";

  const [dashboard, setDashboard] = useState<LandlordDashboardDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postKeyword, setPostKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");

  const loadDashboard = useCallback(async () => {
    if (!maNguoiDung) {
      setDashboard(null);
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getLandlordDashboard(maNguoiDung, {
        period: revenuePeriod,
      });
      setDashboard(data);
    } catch (err) {
      console.error("Load landlord dashboard failed:", err);
      setError("Không tải được dữ liệu doanh thu và thống kê bài đăng.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [maNguoiDung, revenuePeriod]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const posts = useMemo(() => dashboard?.posts ?? [], [dashboard?.posts]);
  const revenues = useMemo(() => dashboard?.revenues ?? [], [dashboard?.revenues]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(posts.map((post) => normalizeStatus(post.trangThai)).filter(Boolean)),
    );

    return [
      { label: "Tất cả trạng thái", value: "ALL" },
      ...uniqueStatuses.map((status) => ({
        label: getStatusMeta(status).label,
        value: status,
      })),
    ];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = postKeyword.trim().toLowerCase();

    return posts.filter((post) => {
      const matchKeyword =
        !keyword ||
        post.maBaiDang.toLowerCase().includes(keyword) ||
        (post.tieuDe || "").toLowerCase().includes(keyword);
      const matchStatus =
        statusFilter === "ALL" || normalizeStatus(post.trangThai) === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [postKeyword, posts, statusFilter]);

  const postChartData = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          safeNumber(b.viewCount) +
          safeNumber(b.likeCount) -
          (safeNumber(a.viewCount) + safeNumber(a.likeCount)),
      )
      .slice(0, 8)
      .map((post) => ({
        name: post.maBaiDang,
        title: post.tieuDe || post.maBaiDang,
        views: safeNumber(post.viewCount),
        likes: safeNumber(post.likeCount),
      }));
  }, [posts]);

  const revenueChartData = useMemo(() => {
    const buckets = new Map<string, { label: string; revenue: number; sortTime: number }>();

    revenues.forEach((item) => {
      const { label, sortTime } = getRevenuePeriodKey(getRevenueDate(item), revenuePeriod);
      const current = buckets.get(label) || { label, revenue: 0, sortTime };

      current.revenue += safeNumber(item.soTien);
      current.sortTime = sortTime || current.sortTime;
      buckets.set(label, current);
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.sortTime - b.sortTime)
      .slice(-8);
  }, [revenues, revenuePeriod]);

  const postColumns: TableProps<LandlordPostStatsDTO>["columns"] = [
    {
      title: "Bài đăng",
      dataIndex: "tieuDe",
      key: "tieuDe",
      render: (_value, record) => (
        <div className="landlord-dashboard-table-title">
          <Link to={`/posts/${record.maBaiDang}`}>
            {record.tieuDe || record.maBaiDang}
          </Link>
          <span>{record.maBaiDang}</span>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      width: 140,
      render: (status) => {
        const meta = getStatusMeta(status);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
      filters: statusOptions
        .filter((option) => option.value !== "ALL")
        .map((option) => ({ text: option.label, value: option.value })),
      onFilter: (value, record) => normalizeStatus(record.trangThai) === value,
    },
    {
      title: "Giá thuê",
      dataIndex: "gia",
      key: "gia",
      align: "right",
      width: 140,
      render: (value) => formatCurrency(safeNumber(value)),
      sorter: (a, b) => safeNumber(a.gia) - safeNumber(b.gia),
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      align: "right",
      width: 120,
      render: (value) => safeNumber(value).toLocaleString("vi-VN"),
      sorter: (a, b) => safeNumber(a.viewCount) - safeNumber(b.viewCount),
    },
    {
      title: "Lượt thích",
      dataIndex: "likeCount",
      key: "likeCount",
      align: "right",
      width: 120,
      render: (value) => safeNumber(value).toLocaleString("vi-VN"),
      sorter: (a, b) => safeNumber(a.likeCount) - safeNumber(b.likeCount),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      width: 160,
      render: (value) => (
        <span className="landlord-dashboard-money">{formatCurrency(safeNumber(value))}</span>
      ),
      sorter: (a, b) => safeNumber(a.revenue) - safeNumber(b.revenue),
    },
  ];

  const revenueColumns: TableProps<LandlordRevenueDTO>["columns"] = [
    {
      title: "Hóa đơn",
      dataIndex: "maHoaDon",
      key: "maHoaDon",
      width: 150,
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Bài đăng",
      dataIndex: "tieuDeBaiDang",
      key: "tieuDeBaiDang",
      render: (_value, record) => (
        <div className="landlord-dashboard-table-title">
          {record.maBaiDang ? (
            <Link to={`/posts/${record.maBaiDang}`}>
              {record.tieuDeBaiDang || record.maBaiDang}
            </Link>
          ) : (
            <span>{record.tieuDeBaiDang || "Không rõ bài đăng"}</span>
          )}
          {record.maBaiDang && <span>{record.maBaiDang}</span>}
        </div>
      ),
    },
    {
      title: "Người thuê",
      dataIndex: "tenNguoiThue",
      key: "tenNguoiThue",
      width: 180,
      render: (value, record) => value || record.maNguoiThue || "-",
    },
    {
      title: "Ngày nhận",
      key: "ngayThanhToan",
      width: 180,
      render: (_value, record) => formatDate(getRevenueDate(record)),
      sorter: (a, b) => getRevenueTime(a) - getRevenueTime(b),
      defaultSortOrder: "descend",
    },
    {
      title: "Số tiền",
      dataIndex: "soTien",
      key: "soTien",
      align: "right",
      width: 160,
      render: (value) => (
        <span className="landlord-dashboard-money">{formatCurrency(safeNumber(value))}</span>
      ),
      sorter: (a, b) => safeNumber(a.soTien) - safeNumber(b.soTien),
    },
    {
      title: "Mã CK",
      dataIndex: "noiDungChuyenKhoan",
      key: "noiDungChuyenKhoan",
      width: 160,
      render: (value) => value || "-",
    },
  ];

  const kpiCards = [
    {
      key: "revenue",
      label: "Doanh thu nhận được",
      value: formatCurrency(safeNumber(dashboard?.totalRevenue)),
      icon: <DollarCircleOutlined />,
    },
    {
      key: "posts",
      label: "Tổng bài đăng",
      value: safeNumber(dashboard?.totalPosts).toLocaleString("vi-VN"),
      icon: <FileTextOutlined />,
    },
    {
      key: "rented",
      label: "Bài đã thuê",
      value: safeNumber(dashboard?.rentedPosts).toLocaleString("vi-VN"),
      icon: <HomeOutlined />,
    },
    {
      key: "views",
      label: "Tổng lượt xem",
      value: safeNumber(dashboard?.totalViews).toLocaleString("vi-VN"),
      icon: <EyeOutlined />,
    },
    {
      key: "likes",
      label: "Tổng lượt thích",
      value: safeNumber(dashboard?.totalLikes).toLocaleString("vi-VN"),
      icon: <HeartOutlined />,
    },
  ];

  return (
    <div className="landlord-dashboard-page">
      <Navbar />

      <main className="landlord-dashboard-content">
        <section className="landlord-dashboard-header">
          <div>
            <p className="landlord-dashboard-eyebrow">Kênh người cho thuê</p>
            <h1>Doanh thu & thống kê bài đăng</h1>
            <p>
              Theo dõi khoản tiền thuê đã nhận, lượt xem và lượt thích của từng tin.
            </p>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadDashboard()}
          >
            Làm mới
          </Button>
        </section>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            className="landlord-dashboard-alert"
          />
        )}

        <section className="landlord-dashboard-kpis" aria-label="Tổng quan">
          {kpiCards.map((item) => (
            <article key={item.key} className={`landlord-dashboard-kpi ${item.key}`}>
              <div className="landlord-dashboard-kpi__icon">{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="landlord-dashboard-grid">
          <div className="landlord-dashboard-panel">
            <div className="landlord-dashboard-panel__header">
              <div>
                <h2>{revenuePeriodTitle[revenuePeriod]}</h2>
                <p>Dữ liệu lấy từ giao dịch ví và hóa đơn thuê đã thanh toán.</p>
              </div>
              <div className="landlord-dashboard-revenue-filters">
                <Select
                  value={revenuePeriod}
                  options={revenuePeriodOptions}
                  onChange={(value) => setRevenuePeriod(value)}
                />
              </div>
            </div>

            <div className="landlord-dashboard-chart">
              {revenueChartData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueChartData} barCategoryGap="42%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${Number(value) / 1000000}tr`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu"
                      fill="#0f766e"
                      maxBarSize={54}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có doanh thu" />
              )}
            </div>
          </div>

          <div className="landlord-dashboard-panel">
            <div className="landlord-dashboard-panel__header">
              <div>
                <h2>Hiệu quả bài đăng</h2>
                <p>Top bài đăng theo lượt xem và lượt thích.</p>
              </div>
              <BarChartOutlined />
            </div>

            <div className="landlord-dashboard-chart">
              {postChartData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={postChartData} barCategoryGap="46%" barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => {
                        const item = postChartData.find((post) => post.name === label);
                        return item?.title || label;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="likes"
                      name="Lượt thích"
                      fill="#e11d48"
                      maxBarSize={28}
                      minPointSize={8}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="views"
                      name="Lượt xem"
                      fill="#2563eb"
                      maxBarSize={28}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài đăng" />
              )}
            </div>
          </div>
        </section>

        <section className="landlord-dashboard-panel landlord-dashboard-panel--wide">
          <div className="landlord-dashboard-panel__header landlord-dashboard-panel__header--actions">
            <div>
              <h2>Thống kê bài đăng</h2>
              <p>Lượt xem, lượt thích và doanh thu theo từng tin.</p>
            </div>

            <div className="landlord-dashboard-filters">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Tìm mã tin, tiêu đề..."
                value={postKeyword}
                onChange={(event) => setPostKeyword(event.target.value)}
              />
              <Select
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
              />
            </div>
          </div>

          <Table
            rowKey="maBaiDang"
            columns={postColumns}
            dataSource={filteredPosts}
            loading={loading}
            pagination={{ pageSize: 6, showSizeChanger: false }}
            scroll={{ x: 920 }}
            locale={{ emptyText: "Chưa có bài đăng phù hợp" }}
          />
        </section>

        <section className="landlord-dashboard-panel landlord-dashboard-panel--wide">
          <div className="landlord-dashboard-panel__header">
            <div>
              <h2>Doanh thu nhận được</h2>
              <p>Danh sách khoản doanh thu theo bộ lọc thời gian.</p>
            </div>
          </div>

          <Table
            rowKey={(record) =>
              record.maGiaoDichVi ||
              [
                record.maHoaDon,
                record.maBaiDang || "invoice",
                record.soTien ?? 0,
                getRevenueDate(record) || "",
              ].join("-")
            }
            columns={revenueColumns}
            dataSource={revenues}
            loading={loading}
            pagination={{ pageSize: 6, showSizeChanger: false }}
            scroll={{ x: 980 }}
            locale={{ emptyText: "Chưa có khoản doanh thu nào" }}
          />
        </section>
      </main>
    </div>
  );
};

export default LandlordDashboardPage;
