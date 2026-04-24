import React from 'react';
import {
  BarChartOutlined,
  CheckSquareOutlined,
  CreditCardOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AdminTopbar from './AdminTopbar';
import './admin-layout.css';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/admin': {
    title: 'Dashboard nhân viên',
    subtitle: 'Theo dõi nhanh bài đăng, thanh toán và hiệu suất vận hành.',
  },
  '/admin/posts': {
    title: 'Duyệt bài đăng',
    subtitle: 'Kiểm tra nội dung, trạng thái và chất lượng bài đăng trước khi hiển thị.',
  },
  '/admin/payments': {
    title: 'Duyệt thanh toán',
    subtitle: 'Đối soát giao dịch đăng bài, xác nhận và xử lý trường hợp lỗi.',
  },
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta['/admin'];

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <div className="admin-layout__brand">
          <div className="admin-layout__brand-badge">EP</div>
          <div>
            <div className="admin-layout__brand-title">Elite Admin</div>
            <div className="admin-layout__brand-subtitle">Nhân viên vận hành</div>
          </div>
        </div>

        <nav className="admin-layout__nav">
          <NavLink
            end
            to="/admin"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <HomeOutlined />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/posts"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <CheckSquareOutlined />
            <span>Duyệt bài đăng</span>
          </NavLink>

          <NavLink
            to="/admin/payments"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <CreditCardOutlined />
            <span>Duyệt thanh toán</span>
          </NavLink>

          <NavLink
            to="/postsadmin"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <BarChartOutlined />
            <span>Quản lý cũ</span>
          </NavLink>
        </nav>

        <div className="admin-layout__footer-card">
          <div className="admin-layout__footer-label">Hàng chờ xử lý hôm nay</div>
          <div className="admin-layout__footer-value">27</div>
          <div className="admin-layout__footer-subtitle">
            18 bài đăng • 9 thanh toán
          </div>
        </div>
      </aside>

      <main className="admin-layout__main">
        <AdminTopbar title={meta.title} subtitle={meta.subtitle} />

        <div className="admin-layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;