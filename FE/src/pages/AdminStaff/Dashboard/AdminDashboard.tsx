import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  adminKpis,
  adminMonthlyStats,
  adminPayments,
  adminPosts,
} from '../../../services/mock/adminStaff.mock';
import { formatCurrency } from '../../../utils/currency';
import './admin-dashboard.css';

const KPI_ICONS: Record<string, React.ReactNode> = {
  pending_posts: <ClockCircleOutlined />,
  approved_posts: <CheckCircleOutlined />,
  pending_payments: <CreditCardOutlined />,
  revenue: <DollarOutlined />,
};

const KPI_COLORS: Record<string, string> = {
  pending_posts: 'warning',
  approved_posts: 'success',
  pending_payments: 'info',
  revenue: 'primary',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="admin-chart-tooltip">
      <div className="admin-chart-tooltip-title">{label}</div>
      <div className="admin-chart-tooltip-list">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="admin-chart-tooltip-item">
            <span
              className="admin-chart-tooltip-dot"
              style={{ background: entry.color }}
            />
            <span>{entry.name}</span>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const pendingPosts = adminPosts
    .filter((item) => item.trangThai === 'CHO_DUYET')
    .slice(0, 4);

  const pendingPayments = adminPayments
    .filter((item) => item.trangThai === 'CHO_XAC_NHAN')
    .slice(0, 4);

  return (
    <div className="admin-dashboard">
      <section className="admin-grid-cards admin-grid-cards--enhanced">
        {adminKpis.map((item) => {
          const tone = KPI_COLORS[item.key] || 'primary';

          return (
            <div className={`admin-stat-card admin-stat-card--${tone}`} key={item.key}>
              <div className="admin-stat-top">
                <div className={`admin-stat-icon admin-stat-icon--${tone}`}>
                  {KPI_ICONS[item.key] || <FileTextOutlined />}
                </div>
                <span className={`admin-stat-chip admin-stat-chip--${tone}`}>
                  {item.trend}
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
          );
        })}
      </section>

      <section className="admin-layout-2col admin-layout-2col--dashboard">
        <div className="admin-panel admin-panel--chart">
          <div className="admin-panel-head">
            <div>
              <h3 className="admin-panel-title">Thống kê 6 tháng gần nhất</h3>
              <p className="admin-panel-subtitle">
                Theo dõi bài đã duyệt, bài chờ duyệt và thanh toán đã xác nhận theo từng tháng.
              </p>
            </div>

            <div className="admin-panel-badge">6 tháng</div>
          </div>

          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={adminMonthlyStats} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 13 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 13 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  dataKey="approvedPosts"
                  fill="#2563eb"
                  name="Bài đã duyệt"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="pendingPosts"
                  fill="#f59e0b"
                  name="Bài chờ duyệt"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="approvedPayments"
                  fill="#10b981"
                  name="Thanh toán xác nhận"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel admin-panel--queue">
          <div className="admin-panel-head">
            <div>
              <h3 className="admin-panel-title">Cần xử lý ngay</h3>
              <p className="admin-panel-subtitle">
                Danh sách bài đăng và giao dịch đang chờ nhân viên xác nhận.
              </p>
            </div>
            <div className="admin-panel-badge admin-panel-badge--danger">
              {pendingPosts.length + pendingPayments.length} mục
            </div>
          </div>

          <div className="admin-queue-section">
            <div className="admin-queue-title">
              <ClockCircleOutlined />
              <span>Bài đăng chờ duyệt</span>
            </div>

            <div className="admin-mini-list">
              {pendingPosts.map((post) => (
                <div key={post.id} className="admin-mini-item admin-mini-item--post">
                  <div className="admin-mini-item-content">
                    <strong>{post.tieuDe}</strong>
                    <div className="admin-subtle">
                      {post.hoVaTenNguoiChoThue} • {post.phuong}
                    </div>
                  </div>
                  <span className="admin-badge pending">Chờ duyệt</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-queue-section">
            <div className="admin-queue-title">
              <CreditCardOutlined />
              <span>Thanh toán chờ xác nhận</span>
            </div>

            <div className="admin-mini-list">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="admin-mini-item admin-mini-item--payment">
                  <div className="admin-mini-item-content">
                    <strong>{payment.maGiaoDich}</strong>
                    <div className="admin-subtle">
                      {payment.hoVaTen} • {formatCurrency(payment.soTien)}
                    </div>
                  </div>
                  <span className="admin-badge info">Chờ xác nhận</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;