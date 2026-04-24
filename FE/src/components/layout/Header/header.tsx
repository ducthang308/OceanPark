import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './header.css';
import { useNavigate } from 'react-router-dom';

type NavItem = {
  key: string;
  label: string;
  to: string;
};

type UserMenuItem = {
  key: string;
  label: string;
  to?: string;
  action?: 'logout';
};

type CurrentUser = {
  id: number;
  fullName: string;
  avatar?: string;
} | null;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // TODO:
  // Sau này thay bằng auth thật từ localStorage / context / redux / zustand
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 1,
    fullName: 'Nguyễn Văn A',
  });
  // Muốn test trạng thái chưa đăng nhập thì đổi thành null

  const navItems: NavItem[] = useMemo(
    () => [
            
    {
        key: '1',
        label: 'Trang Chủ',
        to: '/',
    },
    {
        key: '2',
        label: 'Phòng trọ',
        to: '/danh-muc/phong-tro',
    },
    {
        key: '3',
        label: 'Căn hộ cao cấp',
        to: '/postsadmin',
    },
    {
        key: '4',
        label: 'Nhà nguyên căn',
        to: '/danh-muc/nha-nguyen-can',
    },
    // {
    //     key: '5',
    //     label: 'Căn hộ ở ghép',
    //     to: '/danh-muc/can-ho-o-ghep',
    // },
    {
        key: '6',
        label: 'Căn hộ mini',
        to: '/danh-muc/can-ho-mini',
    },
    {
        key: '7',
        label: 'Mặt bằng cho thuê',
        to: '/danh-muc/mat-bang-cho-thue',
    },
    {
        key: '8',
        label: 'Blog về chúng tôi',
        to: '/blog',
    },
    ],
    [],
  );

  const guestMenuItems: UserMenuItem[] = useMemo(
    () => [
      { key: 'login', label: 'Đăng nhập', to: '/login' },
      { key: 'register', label: 'Đăng ký', to: '/register' },
    ],
    [],
  );

  const authenticatedMenuItems: UserMenuItem[] = useMemo(
    () => [
      { key: 'profile', label: 'Thông tin tài khoản', to: '/AccountManagement' },
      { key: 'my-posts', label: 'Bài đăng của tôi', to: '/list-post' },
      { key: 'transactions', label: 'Quản lý giao dịch', to: '/history?tab=paymentHistory' },
      { key: 'topup', label: 'Nạp tiền', to: '/topup' },
      { key: 'logout', label: 'Đăng xuất', action: 'logout' },
    ],
    [],
  );

  const userMenuItems = currentUser ? authenticatedMenuItems : guestMenuItems;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    // TODO:
    // Thay bằng logout thật:
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');
    // navigate('/login');
    setCurrentUser(null);
    setIsUserMenuOpen(false);
  };

  const headerClassName = [
    'rental-header',
    isScrolled ? 'rental-header--scrolled' : '',
    isMobileMenuOpen ? 'rental-header--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <div className="rental-header__container">
        <Link to="/" className="rental-header__brand" aria-label="Trang chủ">
          <span className="rental-header__brand-text">DThang Home</span>
        </Link>

        <nav className="rental-header__nav" aria-label="Danh mục chính">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `rental-header__nav-link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rental-header__actions">
          <button
            type="button"
            className="rental-header__icon-button"
            aria-label="Tìm kiếm"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13Zm0 0l9.5 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="rental-header__icon-button"
            aria-label="Yêu thích"
            onClick={() => navigate('/favorite-posts')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 20s-6.8-4.3-9-8.2C1.4 8.8 3 5.5 6.4 5.1c2-.2 3.4.8 4.3 2.1c.9-1.3 2.4-2.3 4.3-2.1c3.4.4 5 3.7 3.4 6.7C18.8 15.7 12 20 12 20Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="rental-header__user-menu" ref={userMenuRef}>
            <button
              type="button"
              className={`rental-header__icon-button rental-header__icon-button--user ${
                isUserMenuOpen ? 'is-open' : ''
              }`}
              aria-label="Tài khoản"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm0 2c-4.2 0-7 2.2-7 5v1h14v-1c0-2.8-2.8-5-7-5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={`rental-user-dropdown ${isUserMenuOpen ? 'is-open' : ''}`}>
              {currentUser && (
                <div className="rental-user-dropdown__profile">
                  <div className="rental-user-dropdown__avatar">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="rental-user-dropdown__meta">
                    <p className="rental-user-dropdown__name">{currentUser.fullName}</p>
                    <span className="rental-user-dropdown__subtext">Tài khoản của bạn</span>
                  </div>
                </div>
              )}

              <div className="rental-user-dropdown__list">
                {userMenuItems.map((item) => {
                  if (item.action === 'logout') {
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className="rental-user-dropdown__item rental-user-dropdown__item--button"
                        onClick={handleLogout}
                      >
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      to={item.to || '/'}
                      className="rental-user-dropdown__item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`rental-header__menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
            aria-label="Mở menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`rental-mobile-nav ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="rental-mobile-nav__inner">
          <div className="rental-mobile-nav__section">
            <p className="rental-mobile-nav__label">Danh mục</p>
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  `rental-mobile-nav__link ${isActive ? 'is-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="rental-mobile-nav__section">
            <p className="rental-mobile-nav__label">Tài khoản</p>
            {userMenuItems.map((item) => {
              if (item.action === 'logout') {
                return (
                  <button
                    key={item.key}
                    type="button"
                    className="rental-mobile-nav__link rental-mobile-nav__link--button"
                    onClick={handleLogout}
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.to || '/'}
                  className="rental-mobile-nav__link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;