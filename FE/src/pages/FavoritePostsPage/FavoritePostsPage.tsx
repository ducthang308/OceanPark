import React, { useMemo, useState } from 'react';
import './FavoritePostsPage.css';

type FavoritePostStatus = 'Còn trống' | 'Đã cho thuê' | 'Sắp trống';
type PostCategory = 'PHÒNG TRỌ' | 'CĂN HỘ' | 'NHÀ NGUYÊN CĂN';

interface FavoritePost {
  id: number;
  code: string;
  title: string;
  price: number;
  area: number;
  location: string;
  district: string;
  city: string;
  category: PostCategory;
  displayStatus: string;
  rentalStatus: FavoritePostStatus;
  thumbnail: string;
  imageCount: number;
  startDate: string;
  endDate: string;
  likedAt: string;
  isFeatured?: boolean;
}

const mockFavoritePosts: FavoritePost[] = [
  {
    id: 1,
    code: '685701',
    title: 'Căn hộ full nội thất gần cầu Rồng, vào ở ngay',
    price: 4500000,
    area: 32,
    location: 'Cho thuê căn hộ',
    district: 'Hải Châu',
    city: 'Đà Nẵng',
    category: 'CĂN HỘ',
    displayStatus: 'YÊU THÍCH',
    rentalStatus: 'Còn trống',
    thumbnail:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    imageCount: 5,
    startDate: '10/4/2026',
    endDate: '10/5/2026',
    likedAt: '22/4/2026',
    isFeatured: true,
  },
  {
    id: 2,
    code: '685702',
    title: 'Chính chủ cho thuê phòng trọ mới xây 100%',
    price: 2500000,
    area: 18,
    location: 'Cho thuê phòng trọ',
    district: 'Sơn Trà',
    city: 'Đà Nẵng',
    category: 'PHÒNG TRỌ',
    displayStatus: 'YÊU THÍCH',
    rentalStatus: 'Đã cho thuê',
    thumbnail:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    imageCount: 3,
    startDate: '12/4/2026',
    endDate: '12/5/2026',
    likedAt: '21/4/2026',
  },
  {
    id: 3,
    code: '685703',
    title: 'Nhà nguyên căn 2 phòng ngủ, khu dân cư an ninh',
    price: 7200000,
    area: 58,
    location: 'Cho thuê nhà nguyên căn',
    district: 'Thanh Khê',
    city: 'Đà Nẵng',
    category: 'NHÀ NGUYÊN CĂN',
    displayStatus: 'YÊU THÍCH',
    rentalStatus: 'Sắp trống',
    thumbnail:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
    imageCount: 7,
    startDate: '15/4/2026',
    endDate: '15/5/2026',
    likedAt: '20/4/2026',
  },
];

const formatPrice = (value: number) => {
  return `${value.toLocaleString('vi-VN')} đ/tháng`;
};

const FavoritePostsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoritePost[]>(mockFavoritePosts);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return favorites;

    return favorites.filter((post) => {
      return (
        post.title.toLowerCase().includes(keyword) ||
        post.code.toLowerCase().includes(keyword) ||
        post.district.toLowerCase().includes(keyword) ||
        post.category.toLowerCase().includes(keyword)
      );
    });
  }, [search, favorites]);

  const handleRemoveFavorite = (id: number) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const handleViewDetail = (post: FavoritePost) => {
    console.log('Xem chi tiết bài đăng:', post);
    // navigate(`/post/${post.id}`);
  };

  const handleContact = (post: FavoritePost) => {
    console.log('Liên hệ bài đăng:', post);
  };

  return (
    <div className="favorite-post-page">
      <div className="favorite-post-container">
        <div className="favorite-post-topbar">
          <div className="favorite-post-heading">
            <h1>Danh sách bài đăng yêu thích</h1>
            <p>Lưu lại các tin bạn quan tâm để xem lại nhanh và tiện liên hệ hơn</p>
          </div>

          <div className="favorite-post-search">
            <span className="favorite-post-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Tìm theo mã tin hoặc tiêu đề"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="favorite-post-list">
            {filteredPosts.map((post) => (
              <article className="favorite-post-card" key={post.id}>
                <div className="favorite-post-card__left">
                  <div className="favorite-post-thumb-wrap">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="favorite-post-thumb"
                    />

                    <div className="favorite-post-badge-stack">
                      {post.isFeatured && (
                        <span className="favorite-post-badge favorite-post-badge--featured">
                          NỔI BẬT
                        </span>
                      )}
                      <span className="favorite-post-badge favorite-post-badge--saved">
                        {post.displayStatus}
                      </span>
                    </div>

                    <div className="favorite-post-image-count">
                      <span>📷</span>
                      <strong>{post.imageCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="favorite-post-card__center">
                  <div className="favorite-post-tags">
                    <span className="favorite-post-tag favorite-post-tag--category">
                      {post.category}
                    </span>

                    <span
                      className={`favorite-post-tag favorite-post-tag--status ${
                        post.rentalStatus === 'Còn trống'
                          ? 'is-available'
                          : post.rentalStatus === 'Đã cho thuê'
                          ? 'is-rented'
                          : 'is-soon'
                      }`}
                    >
                      {post.rentalStatus}
                    </span>
                  </div>

                  <h2
                    className="favorite-post-title"
                    onClick={() => handleViewDetail(post)}
                  >
                    {post.title}
                  </h2>

                  <div className="favorite-post-meta">
                    <span className="favorite-post-price">{formatPrice(post.price)}</span>
                    <span className="favorite-post-dot">•</span>
                    <span className="favorite-post-area">{post.area} m²</span>
                    <span className="favorite-post-dot">•</span>
                    <span className="favorite-post-address">
                      {post.location} {post.district}, {post.city}
                    </span>
                  </div>

                  <div className="favorite-post-info-grid">
                    <div className="favorite-post-info-box">
                      <span className="favorite-post-info-label">Mã tin</span>
                      <strong className="favorite-post-info-value">{post.code}</strong>
                    </div>

                    <div className="favorite-post-info-box">
                      <span className="favorite-post-info-label">Ngày bắt đầu</span>
                      <strong className="favorite-post-info-value">{post.startDate}</strong>
                    </div>

                    <div className="favorite-post-info-box">
                      <span className="favorite-post-info-label">Ngày kết thúc</span>
                      <strong className="favorite-post-info-value">{post.endDate}</strong>
                    </div>

                    <div className="favorite-post-info-box">
                      <span className="favorite-post-info-label">Đã lưu ngày</span>
                      <strong className="favorite-post-info-value">{post.likedAt}</strong>
                    </div>
                  </div>
                </div>

                <div className="favorite-post-card__right">
                  <button
                    className="favorite-post-action favorite-post-action--outline"
                    onClick={() => handleViewDetail(post)}
                  >
                    Xem chi tiết
                  </button>

                  <button
                    className="favorite-post-action favorite-post-action--primary"
                    onClick={() => handleContact(post)}
                  >
                    Liên hệ ngay
                  </button>

                  <button
                    className="favorite-post-action favorite-post-action--danger-soft"
                    onClick={() => handleRemoveFavorite(post.id)}
                  >
                    Bỏ yêu thích
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="favorite-post-empty">
            <div className="favorite-post-empty__icon">❤</div>
            <h3>Chưa có bài đăng phù hợp</h3>
            <p>Thử tìm với từ khóa khác hoặc thêm bài đăng mới vào danh sách yêu thích.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritePostsPage;