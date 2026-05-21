import React, { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  CreditCardOutlined,
  GiftOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AdminTopbar from './AdminTopbar';
import { getDashboardStats } from '../../../services/api/AdminDashboardService';
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
  '/admin/categories': {
    title: 'Quản lý danh mục',
    subtitle: 'Tạo, cập nhật và xóa các danh mục bài đăng trong hệ thống.',
  },
  '/admin/packages': {
    title: 'Quản lý gói bài đăng',
    subtitle: 'Thiết lập giá, thời hạn và trạng thái các gói đăng bài.',
  },
  '/admin/payments': {
    title: 'Quản lý thanh toán',
    subtitle: 'Danh sách các giao dịch, hóa đơn và lịch sử thanh toán trên hệ thống.',
  },
  '/admin/accounts': {
    title: 'Quản lý tài khoản',
    subtitle: 'Quản lý hồ sơ, vai trò và trạng thái hoạt động của tài khoản.',
  },
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta['/admin'];
  const [queueSummary, setQueueSummary] = useState({ posts: 0, payments: 0 });

  useEffect(() => {
    let ignore = false;

    const loadQueueSummary = async () => {
      try {
        const stats = await getDashboardStats();

        if (!ignore) {
          setQueueSummary({
            posts: stats.pendingPosts ?? 0,
            payments: stats.pendingPayments ?? 0,
          });
        }
      } catch {
        if (!ignore) setQueueSummary({ posts: 0, payments: 0 });
      }
    };

    void loadQueueSummary();

    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  const queueTotal = queueSummary.posts + queueSummary.payments;

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
            <span>Quản lý thanh toán</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <AppstoreOutlined />
            <span>Quản lý danh mục</span>
          </NavLink>

          <NavLink
            to="/admin/packages"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <GiftOutlined />
            <span>Quản lý gói bài đăng</span>
          </NavLink>

          <NavLink
            to="/admin/accounts"
            className={({ isActive }) =>
              `admin-layout__nav-link ${isActive ? 'active' : ''}`
            }
          >
            <UserOutlined />
            <span>Quản lý tài khoản</span>
          </NavLink>
        </nav>

        <div className="admin-layout__footer-card">
          <div className="admin-layout__footer-label">Hàng chờ xử lý hôm nay</div>
          <div className="admin-layout__footer-value">
            {queueTotal.toLocaleString('vi-VN')}
          </div>
          <div className="admin-layout__footer-subtitle">
            {queueSummary.posts.toLocaleString('vi-VN')} bài đăng •{' '}
            {queueSummary.payments.toLocaleString('vi-VN')} thanh toán
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
