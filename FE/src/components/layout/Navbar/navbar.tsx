import AVT from "../../../assets/img/default-user.svg"
import { Button } from 'antd';
import "./navbar.css";

import {
    EditOutlined,
    FolderOpenOutlined,
    FileTextOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { LANDLORD_ROLE_IDS, ROLE_ID } from '../../../constants/roles';
import type { RoleId } from '../../../constants/roles';
import { useAuth } from '../../../hooks/useAuth';
import { clearAuthSession } from '../../../utils/storage';

type SidebarItem = NonNullable<MenuProps['items']>[number] & {
    allowedRoles?: readonly RoleId[];
};

const items: SidebarItem[] = [
    {
        key: '1',
        icon: <EditOutlined />,
        label: 'Đăng tin mới',
        allowedRoles: LANDLORD_ROLE_IDS,
    },
    {
        key: '2',
        icon: <FolderOpenOutlined />,
        label: 'Danh sách tin đăng',
        allowedRoles: LANDLORD_ROLE_IDS,
    },
    // {
    //     key: '3',
    //     icon: <CreditCardOutlined />,
    //     label: 'Mua gói dịch vụ',
    //     allowedRoles: LANDLORD_ROLE_IDS,
    // },

    {
        key: '5',
        icon: <FileTextOutlined />,
        label: 'Quản lý giao dịch',
        allowedRoles: LANDLORD_ROLE_IDS,
    },
    {
        key: '6',
        icon: <FolderOpenOutlined />,
        label: 'Quản lý gói nạp',
        allowedRoles: LANDLORD_ROLE_IDS,
    },
    // {
    //     key: '7',
    //     icon: <DollarOutlined />,
    //     label: 'Bảng giá dịch vụ',
    //     allowedRoles: LANDLORD_ROLE_IDS,
    // },
    {
        key: '8',
        icon: <UserOutlined />,
        label: 'Quản lý tài khoản',
    },
    {
        key: '10',
        icon: <FileTextOutlined />,
        label: 'Quản lý giao dịch',
        allowedRoles: [ROLE_ID.NGUOI_THUE],
    },
    {
        key: '9',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
    },
];

const navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, roleId } = useAuth();
    const isLandlordRole = Boolean(roleId && LANDLORD_ROLE_IDS.includes(roleId));
    const visibleItems = items.filter((item) => {
        if (!item.allowedRoles) return true;
        return Boolean(roleId && item.allowedRoles.includes(roleId));
    });

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        switch (e.key) {
            case '1':
                navigate('/listing');
                break;
            case '2':
                navigate('/list-post');
                break;
            case '3':
                navigate('/payment/all');
                break;
            case '5':
                navigate('/history?tab=package');
                break;
            case '6':
                navigate('/payment/all'); // Quản lý gói nạp
                break;
            case '7':
                navigate('/payment/all');
                break;
            case '8':
                navigate('/AccountManagement');
                break;
            case '10':
                navigate('/tenant-transactions');
                break;
            case '9':
                clearAuthSession();
                navigate('/login');
                break;
            default:
                break;
        }
    };
    const selectedKey = (() => {
        if (location.pathname === '/listing') return ['1'];
        if (location.pathname === '/list-post') return ['2'];
        if (location.pathname === '/history') return ['5'];
        if (location.pathname === '/AccountManagement') return ['8'];
        if (location.pathname === '/tenant-transactions') return ['10'];
        return [];
    })();

    return (
        <div className="navbar-management">
            <div className="nav-header">
                <div className="avatar-nav">
                    <img src={AVT} alt="" className="avatar" />
                </div>
                <div className="info-nav">
                    <div className="fullname">{user?.hoVaTen || 'Tài khoản'}</div>
                    <div className="phone">{user?.soDienThoai || user?.vaiTro || ''}</div>
                </div>
            </div>

            {isLandlordRole && <div className="nav-payment">
                <div className="balance">
                    <div className="balance-title">Số dư của bạn</div>
                    <div className="balance-number">0</div>
                </div>
                <div className="btn-payment">
                    <Button type="primary"><i className="fa-regular fa-credit-card"></i> Nạp tiền</Button>
                </div>
            </div>}

            <div className="nav-tabs">
                <Menu
                    mode="vertical"
                    className="custom-ant-menu"
                    items={visibleItems}
                    selectedKeys={selectedKey}
                    onClick={handleMenuClick}
                    style={{ width: 240, fontSize: 14, border: 'none' }}
                />
            </div>

            <div className="sticky-bottom">
                <span>Đức Thắng - HUTH - 0325043590</span>
            </div>
        </div>
    )
}

export default navbar
