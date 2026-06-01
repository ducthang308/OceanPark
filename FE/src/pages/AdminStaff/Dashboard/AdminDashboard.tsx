import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BankOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  KeyOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import {
  getDashboardOverview,
  getPendingPosts,
  getPostChart,
  getRevenueChart,
  getUserChart,
  type DashboardChartDTO,
  type DashboardChartSeriesDTO,
  type DashboardChartType,
  type DashboardStatsDTO,
} from '../../../services/api/AdminDashboardService';
import type { BaiDangDTO } from '../../../services/api/PostManagementService';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-dashboard.css';

type StatTone = 'revenue' | 'user' | 'renter' | 'landlord' | 'admin' | 'post' | 'active' | 'rented';
type ChartValueType = 'currency' | 'number';

interface StatCard {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: StatTone;
  icon: React.ReactNode;
}

interface ChartPanelProps {
  title: string;
  description: string;
  chart: DashboardChartDTO | null;
  colors: string[];
  loading: boolean;
  valueType?: ChartValueType;
}

interface PostStatusSlice {
  label: string;
  value: number;
  color: string;
}

interface ChartTooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipState {
  label: string;
  entries: ChartTooltipEntry[];
  x: number;
  y: number;
}

interface PieSegment extends PostStatusSlice {
  percent: number;
  start: number;
  end: number;
}

interface PieTooltipState {
  label: string;
  value: number;
  percent: number;
  color: string;
  x: number;
  y: number;
}

interface PostPiePanelProps {
  chart: DashboardChartDTO | null;
  loading: boolean;
}

interface PendingPostsPanelProps {
  posts: BaiDangDTO[];
  loading: boolean;
  onOpenPost: (maBaiDang?: string) => void;
}

const chartTypeOptions: Array<{ label: string; value: DashboardChartType }> = [
  { label: 'Theo ngày', value: 'day' },
  { label: 'Theo tháng', value: 'month' },
  { label: 'Theo năm', value: 'year' },
];

const safeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatCompactNumber = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return formatNumber(value);
};

const formatChartValue = (value: number, type: ChartValueType) =>
  type === 'currency' ? formatCurrency(value) : formatNumber(value);

const buildCards = (stats: DashboardStatsDTO): StatCard[] => [
  {
    key: 'totalRevenue',
    label: 'Tổng doanh thu',
    value: formatCurrency(safeNumber(stats.totalRevenue)),
    note: 'Giao dịch SUCCESS hợp lệ',
    tone: 'revenue',
    icon: <BankOutlined />,
  },
  {
    key: 'totalUsers',
    label: 'Tổng người dùng',
    value: formatNumber(safeNumber(stats.totalUsers)),
    note: 'Tất cả tài khoản',
    tone: 'user',
    icon: <TeamOutlined />,
  },
  {
    key: 'totalRenters',
    label: 'Tổng người thuê',
    value: formatNumber(safeNumber(stats.totalRenters)),
    note: 'Vai trò Người Thuê',
    tone: 'renter',
    icon: <UserOutlined />,
  },
  {
    key: 'totalLandlords',
    label: 'Tổng người cho thuê',
    value: formatNumber(safeNumber(stats.totalLandlords)),
    note: 'Vai trò Người Cho Thuê',
    tone: 'landlord',
    icon: <HomeOutlined />,
  },
  {
    key: 'totalAdmins',
    label: 'Tổng admin',
    value: formatNumber(safeNumber(stats.totalAdmins)),
    note: 'Tài khoản quản trị',
    tone: 'admin',
    icon: <IdcardOutlined />,
  },
  {
    key: 'totalPosts',
    label: 'Tổng bài đăng',
    value: formatNumber(safeNumber(stats.totalPosts)),
    note: 'Toàn hệ thống',
    tone: 'post',
    icon: <FileTextOutlined />,
  },
  {
    key: 'activePosts',
    label: 'Bài đăng đang hiển thị',
    value: formatNumber(safeNumber(stats.activePosts)),
    note: 'Đang hiển thị',
    tone: 'active',
    icon: <CheckCircleOutlined />,
  },
  {
    key: 'rentedPosts',
    label: 'Bài đăng DA_THUE',
    value: formatNumber(safeNumber(stats.rentedPosts)),
    note: 'Đã cho thuê',
    tone: 'rented',
    icon: <KeyOutlined />,
  },
];

const toChartSeries = (chart: DashboardChartDTO): DashboardChartSeriesDTO[] => {
  if (chart.series && chart.series.length > 0) {
    return chart.series;
  }

  return [{ name: 'Giá trị', values: chart.values }];
};

const chartHasData = (chart: DashboardChartDTO | null) => {
  if (!chart) return false;

  return toChartSeries(chart).some((item) =>
    item.values.some((value) => safeNumber(value) > 0),
  );
};

const sumSeriesValue = (chart: DashboardChartDTO | null, matcher: (name: string) => boolean) => {
  if (!chart) return 0;

  const target = toChartSeries(chart).find((item) => matcher(item.name.toUpperCase()));
  return target?.values.reduce((total, value) => total + safeNumber(value), 0) ?? 0;
};

const buildPostStatusSlices = (chart: DashboardChartDTO | null): PostStatusSlice[] => {
  const totalPosts =
    sumSeriesValue(chart, (name) => name.includes('TỔNG') || name.includes('TONG')) ||
    (chart?.values ?? []).reduce((total, value) => total + safeNumber(value), 0);
  const activePosts = sumSeriesValue(chart, (name) => name === 'APPROVED' || name === 'ACTIVE');
  const rentedPosts = sumSeriesValue(chart, (name) => name === 'DA_THUE');
  const otherPosts = Math.max(totalPosts - activePosts - rentedPosts, 0);

  return [
    { label: 'Đang hiển thị', value: activePosts, color: '#059669' },
    { label: 'DA_THUE', value: rentedPosts, color: '#7c3aed' },
    { label: 'Khác', value: otherPosts, color: '#2563eb' },
  ].filter((item) => item.value > 0);
};

const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  description,
  chart,
  colors,
  loading,
  valueType = 'number',
}) => {
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartTooltip, setChartTooltip] = useState<ChartTooltipState | null>(null);
  const series = useMemo(() => (chart ? toChartSeries(chart) : []), [chart]);
  const hasData = chartHasData(chart);
  const maxValue = useMemo(
    () =>
      Math.max(
        ...series.flatMap((item) => item.values.map((value) => safeNumber(value))),
        1,
      ),
    [series],
  );
  const showChartTooltip = useCallback(
    (
      label: string,
      entries: ChartTooltipEntry[],
      target: HTMLElement,
      pointer?: { clientX: number; clientY: number },
    ) => {
      const boxRect = chartBoxRef.current?.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const rawX = pointer ? pointer.clientX : targetRect.left + targetRect.width / 2;
      const rawY = pointer ? pointer.clientY : targetRect.top + 18;

      setChartTooltip({
        label,
        entries,
        x: boxRect
          ? clampNumber(rawX - boxRect.left, 150, Math.max(150, boxRect.width - 150))
          : 0,
        y: boxRect
          ? clampNumber(rawY - boxRect.top, 110, Math.max(110, boxRect.height - 18))
          : 0,
      });
    },
    [],
  );

  return (
    <article className="admin-dashboard-panel">
      <div className="admin-dashboard-panel__head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-dashboard-chart-state">Đang tải biểu đồ...</div>
      ) : !hasData ? (
        <div className="admin-dashboard-chart-state">Chưa có dữ liệu.</div>
      ) : (
        <div className="admin-dashboard-chart-box" ref={chartBoxRef}>
          <div className="admin-dashboard-chart-scale" aria-hidden="true">
            <span>{valueType === 'currency' ? formatCompactNumber(maxValue) : formatNumber(maxValue)}</span>
            <span>{valueType === 'currency' ? formatCompactNumber(maxValue / 2) : formatNumber(maxValue / 2)}</span>
            <span>0</span>
          </div>

          <div className="admin-dashboard-css-chart">
            {chart?.labels.map((label, labelIndex) => {
              const columnEntries = series.map((item, seriesIndex) => ({
                name: item.name,
                value: safeNumber(item.values[labelIndex]),
                color: colors[seriesIndex % colors.length],
              }));
              const columnSummary = columnEntries
                .map((item) => `${item.name}: ${formatChartValue(item.value, valueType)}`)
                .join(' | ');

              return (
                <div
                  className="admin-dashboard-css-chart__column"
                  key={`${title}-${label}-${labelIndex}`}
                  tabIndex={0}
                  title={`${label}\n${columnSummary}`}
                  aria-label={`${label}: ${columnSummary}`}
                  onFocus={(event) =>
                    showChartTooltip(label, columnEntries, event.currentTarget)
                  }
                  onBlur={() => setChartTooltip(null)}
                  onMouseMove={(event) =>
                    showChartTooltip(label, columnEntries, event.currentTarget, {
                      clientX: event.clientX,
                      clientY: event.clientY,
                    })
                  }
                  onMouseLeave={() => setChartTooltip(null)}
                >
                  <div className="admin-dashboard-css-chart__bars">
                    {series.map((item, seriesIndex) => {
                      const value = columnEntries[seriesIndex]?.value ?? 0;
                      const percent = Math.max((value / maxValue) * 100, value > 0 ? 3 : 0);

                      return (
                        <span
                          key={`${item.name}-${label}`}
                          className="admin-dashboard-css-chart__bar"
                          style={{
                            height: `${percent}%`,
                            background: colors[seriesIndex % colors.length],
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="admin-dashboard-css-chart__label">{label}</span>
                </div>
              );
            })}
          </div>

          {chartTooltip ? (
            <div
              className="admin-dashboard-hover-tooltip"
              style={{ left: chartTooltip.x, top: chartTooltip.y }}
              role="tooltip"
            >
              <strong>{chartTooltip.label}</strong>
              {chartTooltip.entries.map((item) => (
                <span key={item.name}>
                  <i style={{ background: item.color }} />
                  <em>{item.name}</em>
                  <b>{formatChartValue(item.value, valueType)}</b>
                </span>
              ))}
            </div>
          ) : null}

          <div className="admin-dashboard-chart-legend">
            {series.map((item, index) => (
              <span key={item.name}>
                <i style={{ background: colors[index % colors.length] }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

const PostPiePanel: React.FC<PostPiePanelProps> = ({ chart, loading }) => {
  const pieLayoutRef = useRef<HTMLDivElement>(null);
  const [pieTooltip, setPieTooltip] = useState<PieTooltipState | null>(null);
  const slices = useMemo(() => buildPostStatusSlices(chart), [chart]);
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const pieSegments = useMemo<PieSegment[]>(() => {
    let currentDegree = 0;

    if (total <= 0) return [];

    return slices.map((item) => {
      const start = currentDegree;
      const end = currentDegree + (item.value / total) * 360;
      currentDegree = end;
      return {
        ...item,
        percent: Math.round((item.value / total) * 100),
        start,
        end,
      };
    });
  }, [slices, total]);
  const gradient = pieSegments
    .map((item) => `${item.color} ${item.start}deg ${item.end}deg`)
    .join(', ');
  const showPieTooltip = useCallback(
    (
      item: PieSegment,
      target: HTMLElement,
      pointer?: { clientX: number; clientY: number },
    ) => {
      const layoutRect = pieLayoutRef.current?.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const rawX = pointer ? pointer.clientX : targetRect.left + targetRect.width / 2;
      const rawY = pointer ? pointer.clientY : targetRect.top + targetRect.height / 2;

      setPieTooltip({
        label: item.label,
        value: item.value,
        percent: item.percent,
        color: item.color,
        x: layoutRect
          ? clampNumber(rawX - layoutRect.left, 110, Math.max(110, layoutRect.width - 110))
          : 0,
        y: layoutRect
          ? clampNumber(rawY - layoutRect.top, 92, Math.max(92, layoutRect.height - 18))
          : 0,
      });
    },
    [],
  );
  const handlePieMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (pieSegments.length === 0) return;

      const pieRect = event.currentTarget.getBoundingClientRect();
      const centerX = pieRect.left + pieRect.width / 2;
      const centerY = pieRect.top + pieRect.height / 2;
      const angle =
        (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
      const degree = (angle + 90 + 360) % 360;
      const activeSegment =
        pieSegments.find((item) => degree >= item.start && degree < item.end) ??
        pieSegments[pieSegments.length - 1];

      showPieTooltip(activeSegment, event.currentTarget, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [pieSegments, showPieTooltip],
  );

  return (
    <article className="admin-dashboard-panel admin-dashboard-panel--pie">
      <div className="admin-dashboard-panel__head">
        <div>
          <h2>Tỷ lệ bài đăng</h2>
          <p>Phân bổ bài đang hiển thị, DA_THUE và trạng thái khác.</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-dashboard-chart-state">Đang tải biểu đồ...</div>
      ) : total <= 0 ? (
        <div className="admin-dashboard-chart-state">Chưa có dữ liệu bài đăng.</div>
      ) : (
        <div
          className="admin-dashboard-pie-layout"
          ref={pieLayoutRef}
          onMouseLeave={() => setPieTooltip(null)}
        >
          <div
            className="admin-dashboard-pie"
            style={{ background: `conic-gradient(${gradient})` }}
            aria-label="Biểu đồ tròn trạng thái bài đăng"
            onMouseMove={handlePieMouseMove}
            onFocus={() => {
              if (pieSegments[0]) {
                setPieTooltip({
                  label: pieSegments[0].label,
                  value: pieSegments[0].value,
                  percent: pieSegments[0].percent,
                  color: pieSegments[0].color,
                  x: 110,
                  y: 92,
                });
              }
            }}
            onBlur={() => setPieTooltip(null)}
            tabIndex={0}
          >
            <div className="admin-dashboard-pie__center">
              <strong>{formatNumber(total)}</strong>
              <span>Tổng bài</span>
            </div>
          </div>

          {pieTooltip ? (
            <div
              className="admin-dashboard-hover-tooltip admin-dashboard-hover-tooltip--pie"
              style={{ left: pieTooltip.x, top: pieTooltip.y }}
              role="tooltip"
            >
              <strong>{pieTooltip.label}</strong>
              <span>
                <i style={{ background: pieTooltip.color }} />
                <em>Số lượng</em>
                <b>{formatNumber(pieTooltip.value)}</b>
              </span>
              <span>
                <i style={{ background: pieTooltip.color }} />
                <em>Tỷ lệ</em>
                <b>{pieTooltip.percent}%</b>
              </span>
            </div>
          ) : null}

          <div className="admin-dashboard-pie-legend">
            {pieSegments.map((item) => (
                <div
                  className="admin-dashboard-pie-legend__item"
                  key={item.label}
                  tabIndex={0}
                  title={`${item.label}: ${formatNumber(item.value)} (${item.percent}%)`}
                  aria-label={`${item.label}: ${formatNumber(item.value)} (${item.percent}%)`}
                  onFocus={(event) => showPieTooltip(item, event.currentTarget)}
                  onBlur={() => setPieTooltip(null)}
                  onMouseMove={(event) =>
                    showPieTooltip(item, event.currentTarget, {
                      clientX: event.clientX,
                      clientY: event.clientY,
                    })
                  }
                >
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <strong>
                    {formatNumber(item.value)} ({item.percent}%)
                  </strong>
                </div>
              ))}
          </div>
        </div>
      )}
    </article>
  );
};

const PendingPostsPanel: React.FC<PendingPostsPanelProps> = ({ posts, loading, onOpenPost }) => (
  <article className="admin-dashboard-panel admin-dashboard-panel--pending">
    <div className="admin-dashboard-panel__head">
      <div>
        <h2>Bài đăng cần duyệt</h2>
        <p>Danh sách bài mới nhất đang ở trạng thái PENDING.</p>
      </div>
    </div>

    {loading ? (
      <div className="admin-dashboard-chart-state">Đang tải danh sách...</div>
    ) : posts.length === 0 ? (
      <div className="admin-dashboard-chart-state">Không có bài đăng cần duyệt.</div>
    ) : (
      <div className="admin-dashboard-pending-list">
        {posts.map((post) => (
          <button
            type="button"
            className="admin-dashboard-pending-item"
            key={post.maBaiDang}
            onClick={() => onOpenPost(post.maBaiDang)}
          >
            <div>
              <strong>{post.tieuDe || 'Bài đăng chưa có tiêu đề'}</strong>
              <span>
                {post.maBaiDang || '--'} • {post.maNguoiDung || 'Chưa rõ người đăng'}
              </span>
            </div>
            <small>{formatDate(post.ngayDang)}</small>
          </button>
        ))}
      </div>
    )}
  </article>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardStatsDTO | null>(null);
  const [revenueChart, setRevenueChart] = useState<DashboardChartDTO | null>(null);
  const [postChart, setPostChart] = useState<DashboardChartDTO | null>(null);
  const [userChart, setUserChart] = useState<DashboardChartDTO | null>(null);
  const [pendingPosts, setPendingPosts] = useState<BaiDangDTO[]>([]);
  const [chartType, setChartType] = useState<DashboardChartType>('month');
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError('');

    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không tải được thống kê tổng quan';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadCharts = useCallback(async (type: DashboardChartType) => {
    setLoadingCharts(true);

    try {
      const [revenueResult, postResult, userResult, pendingResult] = await Promise.allSettled([
        getRevenueChart(type),
        getPostChart(type),
        getUserChart(),
        getPendingPosts(6),
      ]);

      const hasChartError =
        revenueResult.status === 'rejected' ||
        postResult.status === 'rejected' ||
        userResult.status === 'rejected';

      setRevenueChart(revenueResult.status === 'fulfilled' ? revenueResult.value : null);
      setPostChart(postResult.status === 'fulfilled' ? postResult.value : null);
      setUserChart(userResult.status === 'fulfilled' ? userResult.value : null);
      setPendingPosts(pendingResult.status === 'fulfilled' ? pendingResult.value : []);

      if (hasChartError) {
        message.error('Không tải được một phần dữ liệu biểu đồ');
      }
    } finally {
      setLoadingCharts(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadOverview(), loadCharts(chartType)]);
  }, [chartType, loadCharts, loadOverview]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadCharts(chartType);
  }, [chartType, loadCharts]);

  const cards = useMemo(() => (overview ? buildCards(overview) : []), [overview]);
  const initialLoading = loadingOverview && !overview;
  const handleOpenPost = useCallback((maBaiDang?: string) => {
    if (!maBaiDang) {
      navigate('/admin/posts');
      return;
    }

    navigate(`/admin/post-approval/${maBaiDang}`);
  }, [navigate]);

  if (initialLoading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-state">Đang tải thống kê dashboard...</div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-state admin-dashboard-state--error">
          <p>{error}</p>
          <button type="button" className="admin-dashboard-action" onClick={refreshDashboard}>
            <ReloadOutlined />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-toolbar">
        <div>
          <h2>Dashboard thống kê</h2>
          <p>Doanh thu, tài khoản và bài đăng từ dữ liệu hệ thống.</p>
        </div>

        <button
          type="button"
          className="admin-dashboard-action"
          onClick={refreshDashboard}
          disabled={loadingOverview || loadingCharts}
        >
          <ReloadOutlined />
          {loadingOverview || loadingCharts ? 'Đang tải...' : 'Làm mới'}
        </button>
      </section>

      <section className="admin-dashboard-metrics">
        {cards.map((item) => (
          <article className={`admin-dashboard-kpi admin-dashboard-kpi--${item.tone}`} key={item.key}>
            <div className="admin-dashboard-kpi__icon">{item.icon}</div>
            <div className="admin-dashboard-kpi__body">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-chart-toolbar">
        <div>
          <h2>Biểu đồ theo thời gian</h2>
          <p>Áp dụng cho doanh thu và bài đăng.</p>
        </div>

        <div className="admin-dashboard-periods" aria-label="Chọn kiểu thống kê">
          {chartTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={chartType === option.value ? 'is-active' : ''}
              onClick={() => setChartType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-charts-stacked">
        <ChartPanel
          title="Doanh thu"
          description="Tổng tiền từ giao dịch SUCCESS hợp lệ."
          chart={revenueChart}
          colors={['#d97706']}
          loading={loadingCharts}
          valueType="currency"
        />

        <ChartPanel
          title="Người dùng theo vai trò"
          description="Cơ cấu tài khoản hiện tại."
          chart={userChart}
          colors={['#2563eb']}
          loading={loadingCharts}
        />
      </section>

      <section className="admin-dashboard-panels">
        <PostPiePanel chart={postChart} loading={loadingCharts} />

        <PendingPostsPanel
          posts={pendingPosts}
          loading={loadingCharts}
          onOpenPost={handleOpenPost}
        />
      </section>
    </div>
  );
};

export default AdminDashboard;
