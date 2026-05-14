import './Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { homeMockData } from '../../services/mock/home.mock';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

const Home: React.FC = () => {
  const maNguoiDung = localStorage.getItem('userId');

  const {
    open,
    close,
    loading,
    initialValues,
    submit,
  } = useUserNeedDialog(maNguoiDung);

  const featuredPosts = homeMockData.featuredPosts.slice(0, 3);
  const newestPosts = homeMockData.newestPosts.slice(0, 3);
  const popularDistricts = homeMockData.districts
    .filter((district) => district.id !== 'all')
    .slice(0, 6);

  return (
    <>
      <main className="site-home-page">
        <section className="site-home-hero">
          <div className="site-home-hero__overlay" />

          <div className="site-home-hero__container">
            <div className="site-home-hero__content">
              <p className="site-home-eyebrow">Nền tảng cho thuê nổi bật tại Đà Nẵng</p>
              <h1>{homeMockData.heroTitle}</h1>
              <p className="site-home-hero__description">{homeMockData.heroSubtitle}</p>

              <div className="site-home-hero__actions">
                <Link to="/danh-muc/phong-tro" className="site-home-btn site-home-btn--primary">
                  Khám phá tin thuê
                </Link>
                <Link to="/service-price" className="site-home-btn site-home-btn--ghost">
                  Xem bảng giá
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="site-home-stats">
          <div className="site-home-stats__inner">
            {homeMockData.stats.map((item) => (
              <div key={item.label} className="site-home-stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="site-home-section">
          <div className="site-home-section-heading">
            <span className="site-home-eyebrow">Danh mục nổi bật</span>
            <h2>Khám phá loại hình cho thuê phù hợp với bạn</h2>
          </div>

          <div className="site-home-categories">
            {homeMockData.categories.map((category) => (
              <Link
                key={category.id}
                to={`/danh-muc/${category.slug}`}
                className="site-home-category"
              >
                <span>{String(category.id).padStart(2, '0')}</span>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="site-home-section site-home-section--soft">
          <div className="site-home-section-heading site-home-section-heading--center">
            <span className="site-home-eyebrow">Khu vực phổ biến</span>
            <h2>Tìm kiếm theo quận tại Đà Nẵng</h2>
          </div>

          <div className="site-home-districts">
            {popularDistricts.map((district) => (
              <Link
                key={district.id}
                to="/danh-muc/phong-tro"
                className="site-home-district"
              >
                <strong>{district.name}</strong>
                <span>{district.postCount} tin</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="site-home-section">
          <div className="site-home-section-heading site-home-section-heading--split">
            <div>
              <span className="site-home-eyebrow">Gợi ý dành cho bạn</span>
              <h2>Tin nổi bật theo nhu cầu tìm kiếm</h2>
            </div>
            <Link to="/danh-muc/phong-tro" className="site-home-link">
              Xem tất cả
            </Link>
          </div>

          <div className="site-home-post-grid">
            {featuredPosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="site-home-post">
                <img src={post.coverImage} alt={post.title} />
                <div className="site-home-post__body">
                  <span>{post.categoryLabel}</span>
                  <h3>{post.title}</h3>
                  <p>{post.addressText}</p>
                  <div className="site-home-post__meta">
                    <strong>{post.priceText}</strong>
                    <small>{post.areaText}</small>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="site-home-section site-home-latest">
          <div className="site-home-section-heading site-home-section-heading--split">
            <div>
              <span className="site-home-eyebrow">Tin mới đăng</span>
              <h2>Cập nhật gần đây</h2>
            </div>
            <Link to="/danh-muc/phong-tro" className="site-home-link">
              Xem thêm
            </Link>
          </div>

          <div className="site-home-latest__list">
            {newestPosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="site-home-latest__item">
                <img src={post.coverImage} alt={post.title} />
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.priceText}</p>
                </div>
                <span>{post.postedAtText}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <UserNeedDialog
        open={open}
        loading={loading}
        initialValues={initialValues}
        onClose={close}
        onSubmit={submit}
      />
    </>
  );
};

export default Home;
