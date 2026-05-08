import './Home.css';
import React, { useMemo, useState } from 'react';
import Footer from '../../components/layout/Footer/footer';
import { homeMockData } from '../../services/mock/home.mock';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposal' | 'new' | 'video'>('proposal');
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([102, 104]);

  const maNguoiDung = localStorage.getItem("userId");

  const {
    open,
    close,
    loading,
    initialValues,
    submit,
  } = useUserNeedDialog(maNguoiDung);

  const visibleFeaturedPosts = useMemo(() => {
    if (activeTab === 'video') {
      return homeMockData.featuredPosts.filter((item) => item.hasVideo);
    }

    if (activeTab === 'new') {
      return homeMockData.newestPosts.slice(0, 3);
    }

    return homeMockData.featuredPosts;
  }, [activeTab]);

  const toggleFavorite = (postId: number) => {
    setFavoriteIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId],
    );
  };

  return (
    <>
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero__overlay" />
          <div className="home-hero__container">
            <div className="home-hero__content">
              <p className="home-hero__eyebrow">Nền tảng cho thuê nổi bật tại Đà Nẵng</p>
              <h1>{homeMockData.heroTitle}</h1>
              <p className="home-hero__description">{homeMockData.heroSubtitle}</p>

              <div className="home-hero__actions">
                <a href="/posts" className="home-btn home-btn--primary">
                  Khám phá tin thuê
                </a>
                <a href="/service-price" className="home-btn home-btn--ghost">
                  Xem bảng giá
                </a>
              </div>

              <div className="home-hero__stats">
                {homeMockData.stats.map((item) => (
                  <div key={item.label} className="home-stat-card">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-categories">
          <div className="home-section-heading home-section-heading--center">
            <span>Danh mục nổi bật</span>
            <h2>Khám phá loại hình cho thuê phù hợp với bạn</h2>
          </div>

          <div className="home-categories__grid">
            {homeMockData.categories.map((category) => (
              <a
                key={category.id}
                href={`/posts?category=${category.slug}`}
                className="home-category-card"
              >
                <div className="home-category-card__top">
                  <span className="home-category-card__index">
                    {String(category.id).padStart(2, '0')}
                  </span>
                  <span className="home-category-card__arrow">↗</span>
                </div>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="home-districts">
          <div className="home-section-heading home-section-heading--center">
            <span>Khu vực phổ biến</span>
            <h2>Tìm kiếm theo quận tại Đà Nẵng</h2>
          </div>

          <div className="home-districts__chips">
            {homeMockData.districts.map((district) => (
              <button
                key={district.id}
                type="button"
                className={`home-district-chip ${
                  activeDistrict === district.id ? 'is-active' : ''
                }`}
                onClick={() => setActiveDistrict(district.id)}
              >
                <span>{district.name}</span>
                <small>{district.postCount} tin</small>
              </button>
            ))}
          </div>
        </section>

        <section className="home-content">
          <div className="home-content__container">
            <div className="home-content__main">
              <div className="home-tabs-header">
                <div className="home-section-heading home-section-heading--compact">
                  <span>Gợi ý dành cho bạn</span>
                  <h2>Tin nổi bật theo nhu cầu tìm kiếm</h2>
                </div>

                <div className="home-tabs">
                  <button
                    type="button"
                    className={activeTab === 'proposal' ? 'is-active' : ''}
                    onClick={() => setActiveTab('proposal')}
                  >
                    Đề xuất
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'new' ? 'is-active' : ''}
                    onClick={() => setActiveTab('new')}
                  >
                    Mới đăng
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'video' ? 'is-active' : ''}
                    onClick={() => setActiveTab('video')}
                  >
                    Có video
                  </button>
                </div>
              </div>

              <div className="home-featured-list">
                {visibleFeaturedPosts.map((item) => {
                  const isFavorite = favoriteIds.includes(item.id);
                  const likeCount = (item as any).likeCount ?? 0;

                  return (
                    <a
                      key={item.id}
                      href={`/posts/${item.id}`}
                      className="home-featured-card"
                    >
                      <div className="home-featured-card__image-wrap">
                        <img
                          className="home-featured-card__image"
                          src={item.coverImage || item.gallery?.[1]}
                          alt={item.title}
                        />
                        <div className="home-featured-card__overlay-meta">
                          <span className="home-badge">{item.categoryLabel}</span>
                          {item.hasVideo && (
                            <span className="home-badge home-badge--light">Video</span>
                          )}
                        </div>
                      </div>

                      <div className="home-featured-card__content">
                        <h3>{item.title}</h3>

                        <div className="home-featured-card__meta">
                          <strong>{item.priceText}</strong>
                          <span>{item.areaText}</span>
                          <span>{item.wardText}</span>
                        </div>

                        <p className="home-featured-card__address">{item.addressText}</p>

                        <div className="home-featured-card__footer">
                          <div className="home-featured-card__owner">
                            <b>{item.postedBy}</b>
                            <span>{item.phone}</span>
                          </div>

                          <button
                            type="button"
                            className={`home-like-btn ${isFavorite ? 'is-active' : ''}`}
                            aria-label="Yêu thích bài đăng"
                            onClick={(event) => {
                              event.preventDefault();
                              toggleFavorite(item.id);
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M12 20s-6.8-4.3-9-8.2C1.4 8.8 3 5.5 6.4 5.1c2-.2 3.4.8 4.3 2.1c.9-1.3 2.4-2.3 4.3-2.1c3.4.4 5 3.7 3.4 6.7C18.8 15.7 12 20 12 20Z"
                                fill={isFavorite ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>{likeCount + (isFavorite ? 1 : 0)}</span>
                          </button>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            <aside className="home-sidebar">
              <div className="home-sidebar-card">
                <div className="home-sidebar-card__heading">
                  <span>Lọc nhanh</span>
                  <h3>Khoảng giá phổ biến</h3>
                </div>
                <ul className="home-filter-list">
                  {homeMockData.priceRanges.map((item) => (
                    <li key={item}>
                      <a href="/posts">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="home-sidebar-card">
                <div className="home-sidebar-card__heading">
                  <span>Diện tích</span>
                  <h3>Lựa chọn theo nhu cầu</h3>
                </div>
                <ul className="home-filter-list">
                  {homeMockData.areaRanges.map((item) => (
                    <li key={item}>
                      <a href="/posts">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="home-sidebar-card">
                <div className="home-sidebar-card__heading">
                  <span>Tin mới đăng</span>
                  <h3>Cập nhật gần đây</h3>
                </div>

                <div className="home-new-posts">
                  {homeMockData.newestPosts.map((post) => {
                    const isFavorite = favoriteIds.includes(post.id);
                    const likeCount = (post as any).likeCount ?? 0;

                    return (
                      <a
                        key={post.id}
                        href={`/posts/${post.slug || post.id}`}
                        className="home-new-post"
                      >
                        <div className="home-new-post__image-wrap">
                          <img src={post.coverImage} alt={post.title} />
                        </div>

                        <div className="home-new-post__content">
                          <h4>{post.title}</h4>
                          <strong>{post.priceText}</strong>

                          <div className="home-new-post__meta">
                            <span>{post.areaText}</span>
                            <span>{post.wardText}</span>
                          </div>

                          <div className="home-new-post__bottom">
                            <small>{post.postedAtText}</small>

                            <button
                              type="button"
                              className={`home-like-btn home-like-btn--small ${
                                isFavorite ? 'is-active' : ''
                              }`}
                              aria-label="Yêu thích bài đăng"
                              onClick={(event) => {
                                event.preventDefault();
                                toggleFavorite(post.id);
                              }}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M12 20s-6.8-4.3-9-8.2C1.4 8.8 3 5.5 6.4 5.1c2-.2 3.4.8 4.3 2.1c.9-1.3 2.4-2.3 4.3-2.1c3.4.4 5 3.7 3.4 6.7C18.8 15.7 12 20 12 20Z"
                                  fill={isFavorite ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>{likeCount + (isFavorite ? 1 : 0)}</span>
                            </button>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </aside>
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