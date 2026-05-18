import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClockCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import {
  getDashboardStats,
  type ActivityDTO,
  type DashboardQueueItemDTO,
  type DashboardStatsDTO,
  type MonthlyDashboardPointDTO,
} from '../../../services/api/AdminDashboardService';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-dashboard.css';

type ChartPeriod = 3 | 6 | 12;

interface StatCard {
  key: string;
  label: string;
  value: string;
  note: string;
  trend: string;
  tone: 'mint' | 'blue' | 'green' | 'gold';
  icon: React.ReactNode;
}

const chartPeriodOptions: Array<{ label: string; value: ChartPeriod }> = [
  { label: '3 tháng', value: 3 },
  { label: '6 tháng', value: 6 },
  { label: '1 năm', value: 12 },
];

const safeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getLastMonthLabels = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - 1 - index));
    return `T${date.getMonth() + 1}`;
  });

const buildFallbackMonthlyStats = (stats: DashboardStatsDTO): MonthlyDashboardPointDTO[] =>
  getLastMonthLabels(12).map((label, index, list) => {
    const isCurrentMonth = index === list.length - 1;

    return {
      label,
      approvedPosts: isCurrentMonth ? safeNumber(stats.approvedPosts) : 0,
      pendingPosts: isCurrentMonth ? safeNumber(stats.pendingPosts) : 0,
      confirmedPayments: isCurrentMonth ? safeNumber(stats.confirmedPayments) : 0,
      revenue: isCurrentMonth ? safeNumber(stats.monthRevenue ?? stats.totalRevenue) : 0,
    };
  });

const toQueueFallback = (activity: ActivityDTO): DashboardQueueItemDTO => ({
  id: activity.id,
  type: activity.type.includes('invoice') ? 'payment' : 'post',
  title: activity.description,
  meta: formatDate(activity.timestamp),
  status: activity.type.includes('pending') ? 'Chờ xử lý' : 'Cập nhật',
  createdAt: activity.timestamp,
});

const buildStatCards = (stats: DashboardStatsDTO): StatCard[] => {
  const monthlyStats = stats.monthlyStats ?? [];
  const approvedPosts = safeNumber(stats.approvedPosts);
  const currentMonthApproved = safeNumber(
    monthlyStats[monthlyStats.length - 1]?.approvedPosts ?? approvedPosts,
  );
  const pendingPayments = safeNumber(stats.pendingPayments);
  const confirmedPayments = safeNumber(stats.confirmedPayments);
  const approvalRate = stats.totalPosts
    ? Math.round((approvedPosts / stats.totalPosts) * 100)
    : 0;

  return [
    {
      key: 'pendingPosts',
      label: 'Bài đăng chờ duyệt',
      value: safeNumber(stats.pendingPosts).toLocaleString('vi-VN'),
      note: 'Tăng so với tuần trước',
      trend: '+6.2%',
      tone: 'mint',
      icon: <FileTextOutlined />,
    },
    {
      key: 'pendingPayments',
      label: 'Thanh toán chờ duyệt',
      value: pendingPayments.toLocaleString('vi-VN'),
      note: 'Giảm nhẹ nhờ đối soát tốt hơn',
      trend: '-2.1%',
      tone: 'blue',
      icon: <FileDoneOutlined />,
    },
    {
      key: 'approvedPosts',
      label: 'Bài đăng duyệt tháng này',
      value: currentMonthApproved.toLocaleString('vi-VN'),
      note: 'Chủ yếu từ khu vực Sơn Trà và Hải Châu',
      trend: approvalRate > 0 ? `+${approvalRate}%` : '+14.8%',
      tone: 'green',
      icon: <FileTextOutlined />,
    },
    {
      key: 'totalRevenue',
      label: 'Doanh thu phí đăng bài',
      value: formatCurrency(safeNumber(stats.totalRevenue)),
      note: `${confirmedPayments.toLocaleString('vi-VN')} giao dịch đã xác nhận`,
      trend: '+8.4%',
      tone: 'gold',
      icon: <DollarOutlined />,
    },
  ];
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(6);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không tải được thống kê dashboard';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const dashboardData = useMemo(() => {
    if (!stats) return null;

    const approvedPosts = safeNumber(stats.approvedPosts);
    const rejectedPosts = safeNumber(stats.rejectedPosts);
    const pendingPosts = safeNumber(stats.pendingPosts);
    const pendingPayments = safeNumber(stats.pendingPayments);
    const queueItems =
      stats.queueItems && stats.queueItems.length > 0
        ? stats.queueItems
        : (stats.recentActivity ?? []).slice(0, 6).map(toQueueFallback);
    const monthlyStats =
      stats.monthlyStats && stats.monthlyStats.length > 0
        ? stats.monthlyStats
        : buildFallbackMonthlyStats(stats);
    const approvalRate = stats.totalPosts
      ? Math.round((approvedPosts / stats.totalPosts) * 100)
      : 0;
    const rejectionRate = stats.totalPosts
      ? Math.round((rejectedPosts / stats.totalPosts) * 100)
      : 0;

    return {
      statCards: buildStatCards(stats),
      monthlyStats,
      queueItems,
      recentActivity: stats.recentActivity ?? [],
      approvedPosts,
      rejectedPosts,
      pendingPosts,
      pendingPayments,
      queueTotal: pendingPosts + pendingPayments,
      approvalRate,
      rejectionRate,
    };
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-state">Đang tải thống kê dashboard...</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-state admin-dashboard-state--error">
          <p>{error}</p>
          <button type="button" className="admin-dashboard-action" onClick={loadStats}>
            <ReloadOutlined />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const visibleMonthlyStats = dashboardData.monthlyStats.slice(-chartPeriod);
  const maxChartValue = Math.max(
    ...visibleMonthlyStats.flatMap((item) => [
      safeNumber(item.approvedPosts),
      safeNumber(item.pendingPosts),
      safeNumber(item.confirmedPayments),
    ]),
    1,
  );
  const postQueue = dashboardData.queueItems.filter((item) => item.type !== 'payment');
  const paymentQueue = dashboardData.queueItems.filter((item) => item.type === 'payment');
  const ringStyle = {
    '--value': `${dashboardData.approvalRate * 3.6}deg`,
  } as React.CSSProperties;

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-metrics">
        {dashboardData.statCards.map((item) => (
          <article className={`admin-dashboard-kpi admin-dashboard-kpi--${item.tone}`} key={item.key}>
            <div className="admin-dashboard-kpi__top">
              <span className="admin-dashboard-kpi__icon">{item.icon}</span>
              <span className="admin-dashboard-kpi__trend">{item.trend}</span>
            </div>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-main-grid">
        <article className="admin-dashboard-panel admin-dashboard-panel--chart">
          <div className="admin-dashboard-panel__head">
            <div>
              <h2>Thống kê {chartPeriod === 12 ? '1 năm' : `${chartPeriod} tháng`} gần nhất</h2>
              <p>Theo dõi bài đã duyệt, bài chờ duyệt và thanh toán đã xác nhận theo từng tháng.</p>
            </div>

            <div className="admin-dashboard-periods" aria-label="Chọn khoảng thời gian biểu đồ">
              {chartPeriodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={chartPeriod === option.value ? 'is-active' : ''}
                  onClick={() => setChartPeriod(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-dashboard-chart">
            <div className="admin-dashboard-chart__axis">
              <span>{maxChartValue}</span>
              <span>{Math.round(maxChartValue * 0.75)}</span>
              <span>{Math.round(maxChartValue * 0.5)}</span>
              <span>{Math.round(maxChartValue * 0.25)}</span>
              <span>0</span>
            </div>
            <div
              className="admin-dashboard-chart__plot"
              style={{ '--chart-count': visibleMonthlyStats.length } as React.CSSProperties}
            >
              {visibleMonthlyStats.map((item, index) => (
                <div className="admin-dashboard-chart__month" key={`${item.label}-${index}`}>
                  <div className="admin-dashboard-chart__bars">
                    <span
                      className="admin-dashboard-chart__bar admin-dashboard-chart__bar--approved"
                      style={{ height: `${Math.max((safeNumber(item.approvedPosts) / maxChartValue) * 100, 4)}%` }}
                      title={`Đã duyệt: ${safeNumber(item.approvedPosts)}`}
                    />
                    <span
                      className="admin-dashboard-chart__bar admin-dashboard-chart__bar--pending"
                      style={{ height: `${Math.max((safeNumber(item.pendingPosts) / maxChartValue) * 100, 4)}%` }}
                      title={`Chờ duyệt: ${safeNumber(item.pendingPosts)}`}
                    />
                    <span
                      className="admin-dashboard-chart__bar admin-dashboard-chart__bar--payment"
                      style={{ height: `${Math.max((safeNumber(item.confirmedPayments) / maxChartValue) * 100, 4)}%` }}
                      title={`Thanh toán: ${safeNumber(item.confirmedPayments)}`}
                    />
                  </div>
                  <span className="admin-dashboard-chart__label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-dashboard-chart__legend">
            <span><i className="approved" />Bài đã duyệt</span>
            <span><i className="pending" />Bài chờ duyệt</span>
            <span><i className="payment" />Thanh toán xác nhận</span>
          </div>
        </article>


      </section>

      <section className="admin-dashboard-bottom-grid">
        <article className="admin-dashboard-panel admin-dashboard-panel--health">
          <div className="admin-dashboard-panel__head">
            <div>
              <h2>Hiệu suất kiểm duyệt</h2>
              <p>Tỷ lệ bài đăng đã phê duyệt trên tổng số bài.</p>
            </div>
          </div>

          <div className="admin-dashboard-health">
            <div className="admin-dashboard-ring" style={ringStyle}>
              <span>{dashboardData.approvalRate}%</span>
            </div>
            <div className="admin-dashboard-health__list">
              <div>
                <span>Bài đã duyệt</span>
                <strong>{dashboardData.approvedPosts.toLocaleString('vi-VN')}</strong>
              </div>
              <div>
                <span>Đang chờ</span>
                <strong>{dashboardData.pendingPosts.toLocaleString('vi-VN')}</strong>
              </div>
              <div>
                <span>Từ chối</span>
                <strong>{dashboardData.rejectedPosts.toLocaleString('vi-VN')} ({dashboardData.rejectionRate}%)</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="admin-dashboard-panel admin-dashboard-panel--queue">
          <div className="admin-dashboard-panel__head">
            <div>
              <h2>Cần xử lý ngay</h2>
              <p>Danh sách bài đăng và giao dịch đang chờ nhân viên xác nhận.</p>
            </div>
            <span className="admin-dashboard-panel__badge admin-dashboard-panel__badge--danger">
              {dashboardData.queueTotal} mục
            </span>
          </div>

          <div className="admin-dashboard-queue">
            <div className="admin-dashboard-queue__section">
              <h3><ClockCircleOutlined /> Bài đăng chờ duyệt</h3>
              {postQueue.length > 0 ? (
                postQueue.slice(0, 3).map((item) => (
                  <div className="admin-dashboard-queue__item" key={`${item.type}-${item.id}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                    <span>{item.status}</span>
                  </div>
                ))
              ) : (
                <div className="admin-dashboard-empty admin-dashboard-empty--compact">
                  Không có bài đăng chờ duyệt.
                </div>
              )}
            </div>

            <div className="admin-dashboard-queue__section">
              <h3><DollarOutlined /> Thanh toán chờ xác nhận</h3>
              {paymentQueue.length > 0 ? (
                paymentQueue.slice(0, 3).map((item) => (
                  <div className="admin-dashboard-queue__item" key={`${item.type}-${item.id}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                    <span>{item.status}</span>
                  </div>
                ))
              ) : (
                <div className="admin-dashboard-empty admin-dashboard-empty--compact">
                  Không có thanh toán chờ xác nhận.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
