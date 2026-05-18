import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';
import { LANDLORD_ROLE_IDS } from '../../../constants/roles';
import { useAuth } from '../../../hooks/useAuth';

type FooterLink = {
  label: string;
  to: string;
};

const Footer: React.FC = () => {
  const { roleId } = useAuth();
  const canViewServicePrice = Boolean(roleId && LANDLORD_ROLE_IDS.includes(roleId));

  const propertyLinks: FooterLink[] = [
    { label: 'Phòng trọ', to: '/danh-muc/phong-tro' },
    { label: 'Căn hộ cao cấp', to: '/danh-muc/can-ho-cao-cap' },
    { label: 'Căn hộ chung cư', to: '/danh-muc/can-ho-chung-cu' },
    { label: 'Nhà nguyên căn', to: '/danh-muc/nha-nguyen-can' },
    { label: 'Căn hộ mini', to: '/danh-muc/can-ho-mini' },
    { label: 'Mặt bằng cho thuê', to: '/danh-muc/mat-bang-cho-thue' },
  ];

  const supportLinks: FooterLink[] = [
    { label: 'Giới thiệu', to: '/about' },
    { label: 'Blog về chúng tôi', to: '/blog' },
    ...(canViewServicePrice ? [{ label: 'Bảng giá dịch vụ', to: '/service-price' }] : []),
    { label: 'Liên hệ', to: '/contact' },
    { label: 'Câu hỏi thường gặp', to: '/faqs' },
    { label: 'Điều khoản sử dụng', to: '/terms' },
  ];

  const socialLinks = [
    { label: 'Facebook', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'TikTok', href: '#' },
  ];

  return (
    <footer className="rental-footer">
      <div className="rental-footer__overlay" />

      <div className="rental-footer__container">
        <div className="rental-footer__top">
          <div className="rental-footer__brand-col">
            <Link to="/" className="rental-footer__brand" aria-label="Trang chủ">
              DThang Home
            </Link>

            <p className="rental-footer__description">
              Nền tảng tìm kiếm và đăng tin cho thuê nhà ở, phòng trọ, căn hộ và mặt
              bằng với trải nghiệm rõ ràng, hiện đại và đáng tin cậy.
            </p>

            <ul className="rental-footer__contact-list">
              <li>Địa chỉ: 123 Nguyễn Văn Linh, Đà Nẵng</li>
              <li>Hotline: 0905 000 111</li>
              <li>Email: contact@ducthanghome.vn</li>
            </ul>
          </div>

          <div className="rental-footer__links-col">
            <p className="rental-footer__heading">Danh mục nổi bật</p>
            <ul className="rental-footer__links">
              {propertyLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="rental-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rental-footer__links-col">
            <p className="rental-footer__heading">Thông tin & hỗ trợ</p>
            <ul className="rental-footer__links">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="rental-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rental-footer__social-col">
            <p className="rental-footer__heading">Kết nối với chúng tôi</p>

            <div className="rental-footer__social-list">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rental-footer__social"
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="rental-footer__service-box">
              <span className="rental-footer__service-label">Dành cho chủ nhà</span>
              <h4 className="rental-footer__service-title">Đăng tin nhanh chóng</h4>
              <p className="rental-footer__service-text">
                Quản lý bài đăng, thanh toán dịch vụ và theo dõi hiệu quả tiếp cận
                ngay trên tài khoản của bạn.
              </p>
              {canViewServicePrice && (
                <Link to="/service-price" className="rental-footer__service-btn">
                  Xem bảng giá
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="rental-footer__bottom">
          <p className="rental-footer__copyright">
            © 2026 DucThang Home. All rights reserved.
          </p>

          <div className="rental-footer__bottom-links">
            <Link to="/privacy" className="rental-footer__bottom-link">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="rental-footer__bottom-link">
              Điều khoản
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
