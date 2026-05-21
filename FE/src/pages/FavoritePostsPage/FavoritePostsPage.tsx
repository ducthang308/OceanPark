import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartFilled, SearchOutlined } from '@ant-design/icons';
import './FavoritePostsPage.css';
import fallbackRoomImage from '../../assets/img/co4la.png';
import {
  getApartmentDetailByPost,
  getCategories,
  getFavoriteCountByPost,
  getFavoritePostsByUser,
  getPostById,
  getPostImages,
  getPostImageUrls,
  removeFavoritePost,
} from '../../services/api/PostManagementService';
import type {
  BaiDangDTO,
  BaiDangYeuThichDTO,
  ChiTietCanHoDTO,
  DanhMucDTO,
  HinhAnhBaiDangDTO,
} from '../../services/api/PostManagementService';
import { normalizeText } from '../../services/api/HomeService';
import { getAuthSession } from '../../utils/storage';

type FavoritePostStatus = 'Còn trống' | 'Đã cho thuê' | 'Sắp trống';

interface FavoritePost {
  id: string;
  code: string;
  title: string;
  price: number | null;
  area: number | null;
  location: string;
  district: string;
  city: string;
  category: string;
  displayStatus: string;
  rentalStatus: FavoritePostStatus;
  thumbnail: string;
  imageCount: number;
  startDate: string;
  endDate: string;
  likedAt: string;
  likedAtTime: number;
  likeCount: number;
  isFeatured?: boolean;
}

const PUBLIC_POST_STATUSES = new Set(['ACTIVE', 'APPROVED']);

const formatPrice = (value: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Liên hệ';
  }

  return `${value.toLocaleString('vi-VN')} đ/tháng`;
};

const formatArea = (value: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Đang cập nhật';
  }

  return `${value} m²`;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Đang cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getDateTime = (value?: string | null) => {
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const isPublicPost = (post: BaiDangDTO) => {
  const status = post.trangThai?.trim().toUpperCase();
  return Boolean(status && PUBLIC_POST_STATUSES.has(status));
};

const resolveRentalStatus = (status?: string): FavoritePostStatus => {
  const normalizedStatus = normalizeText(status || '');

  if (
    normalizedStatus.includes('da thue') ||
    normalizedStatus.includes('da cho thue') ||
    normalizedStatus.includes('rented')
  ) {
    return 'Đã cho thuê';
  }

  if (normalizedStatus.includes('sap trong')) {
    return 'Sắp trống';
  }

  return 'Còn trống';
};

const buildFavoritePost = async (
  favorite: BaiDangYeuThichDTO,
  categories: DanhMucDTO[],
  index: number,
): Promise<FavoritePost | null> => {
  const maBaiDang = favorite.maBaiDang?.trim();
  if (!maBaiDang) return null;

  try {
    const [postResponse, detailResponse, imagesResponse, likeCountResponse] = await Promise.all([
      getPostById(maBaiDang),
      getApartmentDetailByPost(maBaiDang).catch(() => null as ChiTietCanHoDTO | null),
      getPostImages(maBaiDang).catch(() => [] as HinhAnhBaiDangDTO[]),
      getFavoriteCountByPost(maBaiDang).catch(() => 0),
    ]);

    if (!isPublicPost(postResponse)) return null;

    const category = categories.find((item) => item.maDanhMuc === postResponse.maDanhMuc);
    const sortedImages = [...imagesResponse].sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0));
    const gallery = getPostImageUrls(sortedImages);
    const address = detailResponse?.diaChiCuThe?.trim() || 'Đang cập nhật địa chỉ';
    const ward = detailResponse?.phuong?.trim() || '';
    const title =
      postResponse.tieuDe?.trim() ||
      favorite.tieuDeBaiDang?.trim() ||
      'Bài đăng chưa có tiêu đề';

    return {
      id: maBaiDang,
      code: maBaiDang,
      title,
      price: typeof detailResponse?.gia === 'number' ? detailResponse.gia : null,
      area: typeof detailResponse?.dienTich === 'number' ? detailResponse.dienTich : null,
      location: address,
      district: ward || 'Đang cập nhật',
      city: 'Đà Nẵng',
      category: category?.tenDanhMuc || postResponse.maDanhMuc || 'Danh mục',
      displayStatus: 'YÊU THÍCH',
      rentalStatus: resolveRentalStatus(postResponse.trangThai),
      thumbnail: gallery[0] || fallbackRoomImage,
      imageCount: gallery.length,
      startDate: formatDate(postResponse.ngayDang),
      endDate: postResponse.trangThai || 'Đang hiển thị',
      likedAt: formatDate(favorite.ngayTao),
      likedAtTime: getDateTime(favorite.ngayTao),
      likeCount: likeCountResponse,
      isFeatured: index < 3,
    };
  } catch {
    return {
      id: maBaiDang,
      code: maBaiDang,
      title: favorite.tieuDeBaiDang?.trim() || 'Bài đăng chưa có tiêu đề',
      price: null,
      area: null,
      location: 'Đang cập nhật địa chỉ',
      district: 'Đang cập nhật',
      city: 'Đà Nẵng',
      category: 'Danh mục',
      displayStatus: 'YÊU THÍCH',
      rentalStatus: 'Còn trống',
      thumbnail: fallbackRoomImage,
      imageCount: 0,
      startDate: 'Đang cập nhật',
      endDate: 'Đang cập nhật',
      likedAt: formatDate(favorite.ngayTao),
      likedAtTime: getDateTime(favorite.ngayTao),
      likeCount: 0,
      isFeatured: index < 3,
    };
  }
};

const FavoritePostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const session = getAuthSession();
  const maNguoiDung = session?.user.maNguoiDung || '';

  const loadFavorites = useCallback(async () => {
    if (!maNguoiDung) {
      setFavorites([]);
      setLoading(false);
      setError('Bạn cần đăng nhập để xem danh sách yêu thích.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [favoritesResponse, categoriesResponse] = await Promise.all([
        getFavoritePostsByUser(maNguoiDung),
        getCategories().catch(() => [] as DanhMucDTO[]),
      ]);

      const mappedPosts = await Promise.all(
        favoritesResponse.map((favorite, index) =>
          buildFavoritePost(favorite, categoriesResponse, index),
        ),
      );

      setFavorites(
        mappedPosts
          .filter((post): post is FavoritePost => Boolean(post))
          .sort((a, b) => b.likedAtTime - a.likedAtTime),
      );
    } catch {
      setFavorites([]);
      setError('Không tải được danh sách yêu thích. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [maNguoiDung]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const filteredPosts = useMemo(() => {
    const keyword = normalizeText(search.trim());

    if (!keyword) return favorites;

    return favorites.filter((post) => {
      const target = normalizeText(
        `${post.title} ${post.code} ${post.district} ${post.category} ${post.location}`,
      );

      return target.includes(keyword);
    });
  }, [search, favorites]);

  const handleRemoveFavorite = async (id: string) => {
    if (!maNguoiDung || removingIds.includes(id)) return;

    setRemovingIds((prev) => [...prev, id]);

    try {
      await removeFavoritePost(maNguoiDung, id);
      await loadFavorites();
      window.dispatchEvent(new Event('favorite-posts:changed'));
    } catch {
      setError('Không thể hủy yêu thích bài đăng này. Vui lòng thử lại.');
    } finally {
      setRemovingIds((prev) => prev.filter((item) => item !== id));
    }
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
            <SearchOutlined className="favorite-post-search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã tin, tiêu đề hoặc khu vực"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="favorite-post-alert">
            <span>{error}</span>
            <button type="button" onClick={loadFavorites}>
              Tải lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="favorite-post-empty">
            <div className="favorite-post-empty__icon">
              <HeartFilled />
            </div>
            <h3>Đang tải danh sách yêu thích</h3>
            <p>Hệ thống đang lấy các tin bạn đã lưu.</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="favorite-post-list">
            {filteredPosts.map((post) => {
              const isRemoving = removingIds.includes(post.id);

              return (
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
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      {post.title}
                    </h2>

                    <div className="favorite-post-meta">
                      <span className="favorite-post-price">{formatPrice(post.price)}</span>
                      <span className="favorite-post-dot">•</span>
                      <span className="favorite-post-area">{formatArea(post.area)}</span>
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
                        <span className="favorite-post-info-label">Ngày đăng</span>
                        <strong className="favorite-post-info-value">{post.startDate}</strong>
                      </div>

                      <div className="favorite-post-info-box">
                        <span className="favorite-post-info-label">Trạng thái</span>
                        <strong className="favorite-post-info-value">{post.endDate}</strong>
                      </div>

                      <div className="favorite-post-info-box">
                        <span className="favorite-post-info-label">Đã lưu ngày</span>
                        <strong className="favorite-post-info-value">{post.likedAt}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="favorite-post-card__right">
                    <Link
                      className="favorite-post-action favorite-post-action--outline"
                      to={`/posts/${post.id}`}
                    >
                      Xem chi tiết
                    </Link>

                    <button
                      className="favorite-post-action favorite-post-action--danger-soft"
                      type="button"
                      disabled={isRemoving}
                      onClick={() => handleRemoveFavorite(post.id)}
                    >
                      {isRemoving ? (
                        'Đang hủy...'
                      ) : (
                        <>
                          <HeartFilled />
                          Bỏ yêu thích
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="favorite-post-empty">
            <div className="favorite-post-empty__icon">
              <HeartFilled />
            </div>
            <h3>Chưa có bài đăng phù hợp</h3>
            <p>Thử tìm với từ khóa khác hoặc thêm bài đăng mới vào danh sách yêu thích.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritePostsPage;
