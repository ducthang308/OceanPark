import './RoomList.css';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { homeMockData } from '../../services/mock/home.mock';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

const POSTS_PER_PAGE = 3;

const RoomList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposal' | 'new' | 'video'>('proposal');
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([102, 104]);
  const [currentPage, setCurrentPage] = useState(1);

  const maNguoiDung = localStorage.getItem('userId');

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

  const totalPages = Math.ceil(visibleFeaturedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = visibleFeaturedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  const handleTabChange = (tab: 'proposal' | 'new' | 'video') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const toggleFavorite = (postId: number) => {
    setFavoriteIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId],
    );
  };

  const getLikeCount = (post: { id: number; likeCount?: number }) => post.likeCount ?? 0;

  return (
    <>
      <main className="room-list-page">
        <section className="room-list-hero">
          <div className="room-list-hero__overlay" />
          <div className="room-list-hero__container">
            <div className="room-list-hero__content">
              <p className="room-list-hero__eyebrow">Nền tảng cho thuê nổi bật tại Đà Nẵng</p>
              <h1>{homeMockData.heroTitle}</h1>
              <p className="room-list-hero__description">{homeMockData.heroSubtitle}</p>

              <div className="room-list-hero__actions">
                <Link to="/danh-muc/phong-tro" className="room-list-btn room-list-btn--primary">
                  Khám phá tin thuê
                </Link>
                <Link to="/service-price" className="room-list-btn room-list-btn--ghost">
                  Xem bảng giá
                </Link>
              </div>

              <div className="room-list-hero__stats">
                {homeMockData.stats.map((item) => (
                  <div key={item.label} className="room-list-stat-card">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="room-list-categories">
          <div className="room-list-section-heading room-list-section-heading--center">
            <span>Danh mục nổi bật</span>
            <h2>Khám phá loại hình cho thuê phù hợp với bạn</h2>
          </div>

          <div className="room-list-categories__grid">
            {homeMockData.categories.map((category) => (
              <Link
                key={category.id}
                to={`/danh-muc/${category.slug}`}
                className="room-list-category-card"
              >
                <div className="room-list-category-card__top">
                  <span className="room-list-category-card__index">
                    {String(category.id).padStart(2, '0')}
                  </span>
                  <span className="room-list-category-card__arrow">↗</span>
                </div>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="room-list-districts">
          <div className="room-list-section-heading room-list-section-heading--center">
            <span>Khu vực phổ biến</span>
            <h2>Tìm kiếm theo quận tại Đà Nẵng</h2>
          </div>

          <div className="room-list-districts__chips">
            {homeMockData.districts.map((district) => (
              <button
                key={district.id}
                type="button"
                className={`room-list-district-chip ${
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

        <section className="room-list-content">
          <div className="room-list-content__container">
            <div className="room-list-content__main">
              <div className="room-list-tabs-header">
                <div className="room-list-section-heading room-list-section-heading--compact">
                  <span>Gợi ý dành cho bạn</span>
                  <h2>Tin nổi bật theo nhu cầu tìm kiếm</h2>
                </div>

                <div className="room-list-tabs">
                  <button
                    type="button"
                    className={activeTab === 'proposal' ? 'is-active' : ''}
                    onClick={() => handleTabChange('proposal')}
                  >
                    Đề xuất
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'new' ? 'is-active' : ''}
                    onClick={() => handleTabChange('new')}
                  >
                    Mới đăng
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'video' ? 'is-active' : ''}
                    onClick={() => handleTabChange('video')}
                  >
                    Có video
                  </button>
                </div>
              </div>

              <div className="room-list-featured-list">
                {paginatedPosts.map((item) => {
                  const isFavorite = favoriteIds.includes(item.id);
                  const likeCount = getLikeCount(item);

                  return (
                    <Link
                      key={item.id}
                      to={`/posts/${item.id}`}
                      className="room-list-featured-card"
                    >
                      <div className="room-list-featured-card__image-wrap">
                        <img
                          className="room-list-featured-card__image"
                          src={item.coverImage || item.gallery?.[1]}
                          alt={item.title}
                        />
                        <div className="room-list-featured-card__overlay-meta">
                          <span className="room-list-badge">{item.categoryLabel}</span>
                          {item.hasVideo && (
                            <span className="room-list-badge room-list-badge--light">
                              Video
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="room-list-featured-card__content">
                        <h3>{item.title}</h3>

                        <div className="room-list-featured-card__meta">
                          <strong>{item.priceText}</strong>
                          <span>{item.areaText}</span>
                          <span>{item.wardText}</span>
                        </div>

                        <p className="room-list-featured-card__address">{item.addressText}</p>

                        <div className="room-list-featured-card__footer">
                          <div className="room-list-featured-card__owner">
                            <b>{item.postedBy}</b>
                            <span>{item.phone}</span>
                          </div>

                          <button
                            type="button"
                            className={`room-list-like-btn ${isFavorite ? 'is-active' : ''}`}
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
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <nav className="room-list-pagination" aria-label="Phân trang tin đăng">
                  <button
                    type="button"
                    className="room-list-pagination__btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    Trước
                  </button>

                  <div className="room-list-pagination__pages">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;

                      return (
                        <button
                          key={page}
                          type="button"
                          className={`room-list-pagination__page ${
                            currentPage === page ? 'is-active' : ''
                          }`}
                          aria-label={`Trang ${page}`}
                          aria-current={currentPage === page ? 'page' : undefined}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="room-list-pagination__btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Sau
                  </button>
                </nav>
              )}
            </div>

            <aside className="room-list-sidebar">
              <div className="room-list-sidebar-card">
                <div className="room-list-sidebar-card__heading">
                  <span>Lọc nhanh</span>
                  <h3>Khoảng giá phổ biến</h3>
                </div>
                <ul className="room-list-filter-list">
                  {homeMockData.priceRanges.map((item) => (
                    <li key={item}>
                      <Link to="/danh-muc/phong-tro">{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="room-list-sidebar-card">
                <div className="room-list-sidebar-card__heading">
                  <span>Diện tích</span>
                  <h3>Lựa chọn theo nhu cầu</h3>
                </div>
                <ul className="room-list-filter-list">
                  {homeMockData.areaRanges.map((item) => (
                    <li key={item}>
                      <Link to="/danh-muc/phong-tro">{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="room-list-sidebar-card">
                <div className="room-list-sidebar-card__heading">
                  <span>Tin mới đăng</span>
                  <h3>Cập nhật gần đây</h3>
                </div>

                <div className="room-list-new-posts">
                  {homeMockData.newestPosts.map((post) => {
                    const isFavorite = favoriteIds.includes(post.id);
                    const likeCount = getLikeCount(post);

                    return (
                      <Link
                        key={post.id}
                        to={`/posts/${post.slug || post.id}`}
                        className="room-list-new-post"
                      >
                        <div className="room-list-new-post__image-wrap">
                          <img src={post.coverImage} alt={post.title} />
                        </div>

                        <div className="room-list-new-post__content">
                          <h4>{post.title}</h4>
                          <strong>{post.priceText}</strong>

                          <div className="room-list-new-post__meta">
                            <span>{post.areaText}</span>
                            <span>{post.wardText}</span>
                          </div>

                          <div className="room-list-new-post__bottom">
                            <small>{post.postedAtText}</small>

                            <button
                              type="button"
                              className={`room-list-like-btn room-list-like-btn--small ${
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
                      </Link>
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

export default RoomList;
