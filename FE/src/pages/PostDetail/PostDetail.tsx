import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PostDetail.css';
import { homeMockData } from '../../services/mock/home.mock';

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const post = useMemo(() => {
    const allPosts = [...homeMockData.featuredPosts, ...homeMockData.newestPosts];
    const uniquePosts = allPosts.filter(
      (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
    );

    return uniquePosts.find((p) => String(p.id) === String(id));
  }, [id]);

  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-container">
          <div className="post-detail-empty">
            <h2>Không tìm thấy bài đăng</h2>
            <p>Tin đăng này không tồn tại hoặc đã bị gỡ khỏi hệ thống.</p>
            <button onClick={() => navigate('/')} className="post-detail-back-btn">
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const detailItems = [
    { label: 'Mức giá', value: post.priceText },
    { label: 'Diện tích', value: post.areaText },
    { label: 'Khu vực', value: post.wardText },
    { label: 'Loại tin', value: post.categoryLabel },
    { label: 'Đăng lúc', value: post.postedAtText },
    { label: 'Liên hệ', value: post.phone },
  ];

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <div className="post-detail-breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span>Tin đăng</span>
          <span>/</span>
          <strong>{post.title}</strong>
        </div>

        <div className="post-detail-layout">
          <div className="post-detail-main">
            <section className="post-detail-gallery-card">
              <div className="post-detail-gallery-main-wrap">
                <img
                  src={post.gallery[activeImage] || post.coverImage}
                  alt={post.title}
                  className="post-detail-gallery-main"
                />

                <div className="post-detail-gallery-badges">
                  {post.isFeatured && (
                    <span className="post-detail-badge post-detail-badge--hot">
                      Nổi bật
                    </span>
                  )}
                  {post.isNew && (
                    <span className="post-detail-badge post-detail-badge--new">
                      Mới đăng
                    </span>
                  )}
                  {post.hasVideo && (
                    <span className="post-detail-badge post-detail-badge--video">
                      Có video
                    </span>
                  )}
                </div>
              </div>

              <div className="post-detail-gallery-thumbs">
                {post.gallery.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={`post-detail-thumb ${activeImage === index ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={img} alt={`${post.title}-${index + 1}`} />
                  </button>
                ))}
              </div>
            </section>

            <section className="post-detail-content-card">
              <div className="post-detail-header">
                <div className="post-detail-header-left">
                  <h1 className="post-detail-title">{post.title}</h1>

                  <div className="post-detail-meta-row">
                    <div className="post-detail-price">{post.priceText}</div>
                    <div className="post-detail-meta-chip">{post.areaText}</div>
                    <div className="post-detail-meta-chip">{post.wardText}</div>
                    <div className="post-detail-meta-chip">{post.categoryLabel}</div>
                  </div>

                  <p className="post-detail-address">{post.addressText}</p>
                </div>

                <button
                  type="button"
                  className={`post-detail-favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={() => setIsFavorite((prev) => !prev)}
                >
                  {isFavorite ? '♥ Đã lưu' : '♡ Lưu tin'}
                </button>
              </div>

              <div className="post-detail-info-grid">
                {detailItems.map((item) => (
                  <div key={item.label} className="post-detail-info-item">
                    <span className="post-detail-info-label">{item.label}</span>
                    <strong className="post-detail-info-value">{item.value}</strong>
                  </div>
                ))}
              </div>

              {post.tags?.length > 0 && (
                <div className="post-detail-section">
                  <h3 className="post-detail-section-title">Từ khóa nổi bật</h3>
                  <div className="post-detail-tag-list">
                    {post.tags.map((tag) => (
                      <span key={tag} className="post-detail-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="post-detail-section">
                <h3 className="post-detail-section-title">Mô tả chi tiết</h3>
                <p className="post-detail-description">{post.description}</p>
              </div>

              {post.amenities?.length > 0 && (
                <div className="post-detail-section">
                  <h3 className="post-detail-section-title">Tiện ích</h3>
                  <div className="post-detail-amenities">
                    {post.amenities.map((item) => (
                      <div key={item} className="post-detail-amenity">
                        <span className="post-detail-amenity-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="post-detail-sidebar">
            <div className="post-detail-owner-card">
              <div className="post-detail-owner-avatar">
                {post.postedBy?.charAt(0)?.toUpperCase() || 'C'}
              </div>

              <div className="post-detail-owner-content">
                <p className="post-detail-owner-label">Người đăng</p>
                <h3 className="post-detail-owner-name">{post.postedBy}</h3>
                <p className="post-detail-owner-subtext">
                  Tin đăng đang hoạt động, phản hồi nhanh
                </p>
              </div>

              <div className="post-detail-owner-actions">
                <a href={`tel:${post.phone}`} className="post-detail-btn post-detail-btn--call">
                  Gọi ngay
                </a>

                <button
                  type="button"
                  className="post-detail-btn post-detail-btn--zalo"
                >
                  Nhắn Zalo
                </button>

                <button
                  type="button"
                  className="post-detail-btn post-detail-btn--primary"
                  onClick={() => navigate(`/payment/${post.id}`)}
                >
                  Thanh toán / Đặt cọc
                </button>
              </div>

              <div className="post-detail-owner-note">
                Ưu tiên người thuê thiện chí, có thể giữ chỗ nhanh sau khi thanh toán.
              </div>
            </div>

            <div className="post-detail-side-card">
              <h4 className="post-detail-side-title">Cam kết hiển thị</h4>
              <ul className="post-detail-side-list">
                <li>Thông tin rõ ràng, dễ theo dõi</li>
                <li>Ảnh hiển thị lớn, dễ xem trên mobile</li>
                <li>Nút liên hệ và thanh toán nổi bật</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;