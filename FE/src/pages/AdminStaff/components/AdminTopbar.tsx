import React, { useState } from 'react';
import { DownOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './admin-topbar.css';
import { clearAuthSession } from '../../../utils/storage';

interface Props {
  title: string;
  subtitle: string;
}

const AdminTopbar: React.FC<Props> = ({ title, subtitle }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <div className="admin-topbar">
      <div className="admin-topbar__left">
        <h1 className="admin-topbar__title">{title}</h1>
        <div className="admin-topbar__subtitle">{subtitle}</div>
      </div>

      <div className="admin-topbar__user-wrapper">
        <div
          className="admin-topbar__userbox"
          onClick={() => setOpen((prev) => !prev)}
        >
          <div className="admin-topbar__avatar">NV</div>

          <div className="admin-topbar__user-info">
            <strong className="admin-topbar__user-name">Nhân viên Elite</strong>
            <div className="admin-topbar__user-role">Kiểm duyệt & đối soát</div>
          </div>

          <DownOutlined className="admin-topbar__caret" />
        </div>

        {open && (
          <div className="admin-topbar__dropdown">
            <div className="admin-topbar__dropdown-item" onClick={handleLogout}>
              <LogoutOutlined />
              <span>Đăng xuất</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTopbar;
