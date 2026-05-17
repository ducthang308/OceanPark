import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import {
  getDashboardStats,
  type DashboardStatsDTO,
} from '../../../services/api/AdminDashboardService';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-dashboard.css';

interface StatCard {
  key: string;
  label: string;
  value: number;
  note: string;
  unit?: 'VND';
  tone: string;
  icon: React.ReactNode;
}

const buildStatCards = (stats: DashboardStatsDTO): StatCard[] => [
  {
    key: 'totalUsers',
    label: 'Tổng tài khoản',
    value: stats.totalUsers,
    note: 'Tất cả người dùng đã tạo trong hệ thống',
    tone: 'primary',
    icon: <TeamOutlined />,
  },
  {
    key: 'totalPosts',
    label: 'Tổng bài đăng',
    value: stats.totalPosts,
    note: 'Bao gồm bài chờ duyệt, đã duyệt và bị từ chối',
    tone: 'success',
    icon: <FileTextOutlined />,
  },
  {
    key: 'pendingPosts',
    label: 'Bài chờ duyệt',
    value: stats.pendingPosts,
    note: 'Các bài đang ở trạng thái PENDING',
    tone: 'warning',
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'totalRevenue',
    label: 'Doanh thu',
    value: stats.totalRevenue,
    note: 'Tổng hóa đơn thanh toán thành công',
    unit: 'VND',
    tone: 'info',
    icon: <DollarOutlined />,
  },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const statCards = useMemo(() => (stats ? buildStatCards(stats) : []), [stats]);
  const recentActivity = stats?.recentActivity ?? [];

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
          <button type="button" className="admin-dashboard-retry" onClick={loadStats}>
            <ReloadOutlined />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-grid-cards admin-grid-cards--enhanced">
        {statCards.map((item) => (
          <div className={`admin-stat-card admin-stat-card--${item.tone}`} key={item.key}>
            <div className="admin-stat-top">
              <div className={`admin-stat-icon admin-stat-icon--${item.tone}`}>
                {item.icon}
              </div>
              <span className={`admin-stat-chip admin-stat-chip--${item.tone}`}>
                Cập nhật
              </span>
            </div>

            <div className="admin-stat-label">{item.label}</div>

            <div className="admin-stat-value">
              {item.unit === 'VND'
                ? formatCurrency(item.value)
                : item.value.toLocaleString('vi-VN')}
            </div>

            <div className="admin-stat-note">
              <span>{item.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-panel admin-panel--queue">
        <div className="admin-panel-head">
          <div>
            <h3 className="admin-panel-title">Hoạt động gần đây</h3>
            <p className="admin-panel-subtitle">
              Các cập nhật mới nhất trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={loadStats}
            disabled={loading}
          >
            <ReloadOutlined />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        <div className="admin-mini-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="admin-mini-item admin-mini-item--post">
                <div className="admin-mini-item-content">
                  <strong>{activity.description}</strong>
                  <div className="admin-subtle">{formatDate(activity.timestamp)}</div>
                </div>
                <span className="admin-badge info">
                  <CheckCircleOutlined />
                </span>
              </div>
            ))
          ) : (
            <div className="admin-dashboard-empty">Chưa có hoạt động gần đây.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
