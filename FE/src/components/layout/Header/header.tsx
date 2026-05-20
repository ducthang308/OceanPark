import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './header.css';
import { LANDLORD_ROLE_IDS, ROLE_ID } from '../../../constants/roles';
import type { RoleId } from '../../../constants/roles';
import { clearAuthSession, getAuthSession } from '../../../utils/storage';
import { getFavoritePostsByUser } from '../../../services/api/PostManagementService';

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
  allowedRoles?: readonly RoleId[];
};

type CurrentUser = {
  maNguoiDung: string;
  hoVaTen: string;
  vaiTro: string;
  anhDaiDien?: string | null;
  roleId: RoleId | null;
} | null;

// Đọc thông tin user từ localStorage
const getUserFromStorage = (): CurrentUser => {
  const session = getAuthSession();

  if (!session) return null;

  return {
    maNguoiDung: session.user.maNguoiDung,
    hoVaTen: session.user.hoVaTen,
    vaiTro: session.user.vaiTro,
    anhDaiDien: session.user.anhDaiDien,
    roleId: session.roleId,
  };
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteTotal, setFavoriteTotal] = useState(0);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy thông tin user thật từ localStorage
  const [currentUser, setCurrentUser] = useState<CurrentUser>(getUserFromStorage);

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
        to: '/danh-muc/can-ho',
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
      {
        key: 'tenant-transactions',
        label: 'Quản lý giao dịch',
        to: '/tenant-transactions',
        allowedRoles: [ROLE_ID.NGUOI_THUE],
      },
      {
        key: 'my-posts',
        label: 'Bài đăng của tôi',
        to: '/list-post',
        allowedRoles: LANDLORD_ROLE_IDS,
      },
      {
        key: 'landlord-dashboard',
        label: 'Doanh thu & thống kê',
        to: '/landlord-dashboard',
        allowedRoles: LANDLORD_ROLE_IDS,
      },
      {
        key: 'transactions',
        label: 'Quản lý giao dịch',
        to: '/history?tab=recharge',
        allowedRoles: LANDLORD_ROLE_IDS,
      },
      {
        key: 'topup',
        label: 'Nạp tiền',
        to: '/recharge/payoo',
        allowedRoles: LANDLORD_ROLE_IDS,
      },
      { key: 'logout', label: 'Đăng xuất', action: 'logout' },
    ],
    [],
  );

  const userMenuItems = currentUser
    ? authenticatedMenuItems.filter((item) => {
      if (!item.allowedRoles) return true;
      return Boolean(currentUser.roleId && item.allowedRoles.includes(currentUser.roleId));
    })
    : guestMenuItems;

  // Lắng nghe thay đổi localStorage khi login/logout ở tab khác
  useEffect(() => {
    const syncUser = () => setCurrentUser(getUserFromStorage());
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Cập nhật lại user mỗi khi chuyển trang (sau khi login navigate về /)
  useEffect(() => {
    setCurrentUser(getUserFromStorage());
  }, [location.pathname]);

  useEffect(() => {
    let ignore = false;

    const loadFavoriteTotal = async () => {
      if (!currentUser?.maNguoiDung) {
        setFavoriteTotal(0);
        return;
      }

      try {
        const favoritesResponse = await getFavoritePostsByUser(currentUser.maNguoiDung);

        if (!ignore) {
          setFavoriteTotal(favoritesResponse.length);
        }
      } catch {
        if (!ignore) {
          setFavoriteTotal(0);
        }
      }
    };

    loadFavoriteTotal();
    window.addEventListener('favorite-posts:changed', loadFavoriteTotal);

    return () => {
      ignore = true;
      window.removeEventListener('favorite-posts:changed', loadFavoriteTotal);
    };
  }, [currentUser?.maNguoiDung, location.pathname]);

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
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const currentKeyword = new URLSearchParams(location.search).get('q') || '';
    setSearchQuery(currentKeyword);
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
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
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isSearchOpen]);

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keyword = searchQuery.trim();

    setIsSearchOpen(false);

    if (!keyword) {
      navigate('/posts');
      return;
    }

    navigate(`/posts?q=${encodeURIComponent(keyword)}`);
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
          <div className="rental-header__search" ref={searchRef}>
            <button
              type="button"
              className={`rental-header__icon-button rental-header__icon-button--search ${
                isSearchOpen ? 'is-open' : ''
              }`}
              aria-label="Tìm kiếm"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((prev) => !prev)}
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

            <form
              className={`rental-header-search ${isSearchOpen ? 'is-open' : ''}`}
              onSubmit={handleSearchSubmit}
            >
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                placeholder="Tìm theo tiêu đề, phường, địa chỉ..."
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button type="submit" aria-label="Tìm kiếm">
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
            </form>
          </div>

          <button
            type="button"
            className="rental-header__icon-button rental-header__icon-button--favorite"
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
            {favoriteTotal > 0 && (
              <span className="rental-header__favorite-badge">{favoriteTotal}</span>
            )}
          </button>

          <div className="rental-header__user-menu" ref={userMenuRef}>
            <button
              type="button"
              className={`rental-header__icon-button rental-header__icon-button--user ${isUserMenuOpen ? 'is-open' : ''
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
                    {currentUser.anhDaiDien ? (
                      <img src={currentUser.anhDaiDien} alt={currentUser.hoVaTen} />
                    ) : (
                      currentUser.hoVaTen.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="rental-user-dropdown__meta">
                    <p className="rental-user-dropdown__name">{currentUser.hoVaTen}</p>
                    <span className="rental-user-dropdown__subtext">{currentUser.vaiTro || 'Tài khoản của bạn'}</span>
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
