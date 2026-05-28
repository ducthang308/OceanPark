import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createSepayPayment } from '../../services/api/PostManagementService';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './PostDetail.css';
import fallbackRoomImage from '../../assets/img/co4la.png';
import {
  addFavoritePost,
  getApartmentDetailByPost,
  getCategories,
  getFavoriteCountByPost,
  getFavoritePostsByUser,
  getPostById,
  getPostImages,
  getPostImageUrls,
  getPostVideoUrls,
  increasePostView,
  removeFavoritePost,
} from '../../services/api/PostManagementService';
import type {
  BaiDangDTO,
  ChiTietCanHoDTO,
  DanhMucDTO,
  HinhAnhBaiDangDTO,
} from '../../services/api/PostManagementService';
import { homeMockData } from '../../services/mock/home.mock';
import { getUserById } from '../../services/api/UserService';
import type { UserProfileResponse } from '../../services/api/UserService';
import { getAuthSession } from '../../utils/storage';
import { getOrCreateRoom } from '../../services/api/ChatService';

interface PostDetailView {
  id: string;
  title: string;
  priceText: string;
  areaText: string;
  directionText: string;
  addressText: string;
  wardText: string;
  categoryLabel: string;
  description: string;
  coverImage: string;
  gallery: string[];
  postedBy: string;
  ownerAvatar?: string | null;
  postedAtText: string;
  phone: string;
  tags: string[];
  amenities: string[];
  videoUrls: string[];
  hasVideo: boolean;
  isFeatured: boolean;
  isNew: boolean;
  ownerId?: string;
}

const PUBLIC_POST_STATUSES = new Set(['ACTIVE', 'APPROVED']);

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Liên hệ';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)}đ/tháng`;
};

const parsePriceToNumber = (priceText?: string) => {
  if (!priceText) return 0;

  const numberOnly = priceText.replace(/[^\d]/g, '');
  return Number(numberOnly || 0);
};

const formatArea = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Đang cập nhật';
  }

  return `${value} m²`;
};

const formatPostedAt = (value?: string) => {
  if (!value) return 'Mới cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const isPublicPost = (post: BaiDangDTO) => {
  const status = post.trangThai?.trim().toUpperCase();
  return Boolean(status && PUBLIC_POST_STATUSES.has(status));
};

const findMockPost = (id?: string): PostDetailView | null => {
  if (!id) return null;

  const allPosts = [...homeMockData.featuredPosts, ...homeMockData.newestPosts];
  const uniquePosts = allPosts.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
  );
  const post = uniquePosts.find((item) => String(item.id) === String(id));

  if (!post) return null;

  return {
    ...post,
    id: String(post.id),
    directionText: 'Đang cập nhật',
    gallery: post.gallery.length > 0 ? post.gallery : [post.coverImage || fallbackRoomImage],
    coverImage: post.coverImage || post.gallery[0] || fallbackRoomImage,
    ownerAvatar: null,
    videoUrls: [],
    isFeatured: Boolean(post.isFeatured),
    isNew: Boolean(post.isNew),
    hasVideo: Boolean(post.hasVideo),
  };
};

const buildApiPostDetail = (
  post: BaiDangDTO,
  detail: ChiTietCanHoDTO | null,
  images: HinhAnhBaiDangDTO[],
  categories: DanhMucDTO[],
  owner: UserProfileResponse | null,
  currentUserId?: string,
): PostDetailView | null => {
  if (!post.maBaiDang) return null;

  const isOwner = Boolean(currentUserId && post.maNguoiDung === currentUserId);

  if (!isOwner && !isPublicPost(post)) return null;

  const category = categories.find((item) => item.maDanhMuc === post.maDanhMuc);
  const sortedImages = [...images].sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0));
  const gallery = getPostImageUrls(sortedImages);
  const videoUrls = getPostVideoUrls(sortedImages);
  const directionText = detail?.huongCanHo?.trim() || 'Đang cập nhật';
  const wardText = detail?.phuong?.trim() || 'Đang cập nhật';
  const addressText =
    [detail?.diaChiCuThe, detail?.phuong].filter(Boolean).join(', ') ||
    'Đang cập nhật địa chỉ';

  return {
    id: post.maBaiDang,
    title: post.tieuDe?.trim() || 'Bài đăng chưa có tiêu đề',
    priceText: formatCurrency(detail?.gia),
    areaText: formatArea(detail?.dienTich),
    directionText,
    addressText,
    wardText,
    categoryLabel: category?.tenDanhMuc || post.maDanhMuc || 'Danh mục',
    description: post.noiDung?.trim() || 'Chưa có mô tả chi tiết.',
    coverImage: gallery[0] || fallbackRoomImage,
    gallery: gallery.length > 0 ? gallery : [fallbackRoomImage],
    postedBy: owner?.hoVaTen?.trim() || 'Chủ nhà',
    ownerAvatar: owner?.anhDaiDien || null,
    postedAtText: formatPostedAt(post.ngayDang),
    phone: post.lienHe?.trim() || owner?.soDienThoai?.trim() || 'Đang cập nhật',
    tags: [],
    amenities: [],
    videoUrls,
    hasVideo: videoUrls.length > 0,
    isFeatured: true,
    isNew: true,
    ownerId: post.maNguoiDung,
  };
};

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState<PostDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const viewedRef = useRef(false);

  const maNguoiDung = getAuthSession()?.user.maNguoiDung || '';

  useEffect(() => {
    if (!id || viewedRef.current) return;

    const key = `viewed_post_${id}`;
    const viewedTime = localStorage.getItem(key);
    const THIRTY_MINUTES = 30 * 60 * 1000;

    if (
      viewedTime &&
      Date.now() - Number(viewedTime) < THIRTY_MINUTES
    ) {
      viewedRef.current = true;
      return;
    }

    viewedRef.current = true;

    increasePostView(id)
      .then(() => {
        localStorage.setItem(key, Date.now().toString());
      })
      .catch((error) => {
        console.error('Không thể tăng lượt xem:', error);
      });
  }, [id]);

  useEffect(() => {
    let ignore = false;

    const loadPostDetail = async () => {
      if (!id) {
        setPost(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');
      setActiveImage(0);

      try {
        const [postResponse, categoriesResponse] = await Promise.all([
          getPostById(id),
          getCategories().catch(() => [] as DanhMucDTO[]),
        ]);
        const maBaiDang = postResponse.maBaiDang || id;
        const [detailResponse, imagesResponse] = await Promise.all([
          getApartmentDetailByPost(maBaiDang).catch(() => null),
          getPostImages(maBaiDang).catch(() => [] as HinhAnhBaiDangDTO[]),
        ]);
        const ownerResponse = postResponse.maNguoiDung && maNguoiDung
          ? await getUserById(postResponse.maNguoiDung).catch(() => null)
          : null;
        const mappedPost = buildApiPostDetail(
          postResponse,
          detailResponse,
          imagesResponse,
          categoriesResponse,
          ownerResponse,
          maNguoiDung,
        );

        if (!ignore) {
          setPost(mappedPost);
        }
      } catch {
        const mockPost = findMockPost(id);

        if (!ignore) {
          setPost(mockPost);
          setLoadError(mockPost ? '' : 'Không tải được thông tin bài đăng.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPostDetail();

    return () => {
      ignore = true;
    };
  }, [id, maNguoiDung]);

  useEffect(() => {
    let ignore = false;

    const loadFavoriteInfo = async () => {
      if (!post?.id) {
        setIsFavorite(false);
        setFavoriteCount(0);
        return;
      }

      const [countResponse, favoritesResponse] = await Promise.all([
        getFavoriteCountByPost(post.id).catch(() => 0),
        maNguoiDung
          ? getFavoritePostsByUser(maNguoiDung).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (ignore) return;

      setFavoriteCount(countResponse);
      setIsFavorite(
        favoritesResponse.some((favorite) => favorite.maBaiDang?.trim() === post.id),
      );
    };

    loadFavoriteInfo();

    return () => {
      ignore = true;
    };
  }, [maNguoiDung, post?.id]);

  const handleToggleFavorite = async () => {
    if (!post?.id) return;

    if (!maNguoiDung) {
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        await removeFavoritePost(maNguoiDung, post.id);
      } else {
        await addFavoritePost(maNguoiDung, post.id);
      }
    } catch {
      // Dữ liệu có thể đã đổi ở nơi khác; luôn lấy lại trạng thái thật từ API bên dưới.
    }

    try {
      const [countResponse, favoritesResponse] = await Promise.all([
        getFavoriteCountByPost(post.id),
        getFavoritePostsByUser(maNguoiDung),
      ]);

      setFavoriteCount(countResponse);
      setIsFavorite(
        favoritesResponse.some((favorite) => favorite.maBaiDang?.trim() === post.id),
      );
      window.dispatchEvent(new Event('favorite-posts:changed'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const detailItems = useMemo(() => {
    if (!post) return [];

    return [
      { label: 'Mức giá', value: post.priceText },
      { label: 'Diện tích', value: post.areaText },
      { label: 'Hướng căn hộ', value: post.directionText },
      { label: 'Khu vực', value: post.wardText },
      { label: 'Loại tin', value: post.categoryLabel },
      { label: 'Đăng lúc', value: post.postedAtText },
      { label: 'Liên hệ', value: post.phone },
    ];
  }, [post]);

  const handleRentApartment = async () => {
    try {
      const maNguoiDung =
        localStorage.getItem('maNguoiDung') ||
        localStorage.getItem('userId');

      if (!maNguoiDung) {
        alert('Vui lòng đăng nhập trước khi thuê căn hộ');
        navigate('/login', {
          state: {
            from: {
              pathname: location.pathname,
              search: location.search,
            },
          },
        });
        return;
      }

      if (!post?.id) {
        alert('Không tìm thấy bài đăng');
        return;
      }

      const soTien = parsePriceToNumber(post.priceText);

      if (!soTien || soTien <= 0) {
        alert('Không xác định được giá thuê căn hộ');
        return;
      }

      const payment = await createSepayPayment({
        maNguoiDung,
        maBaiDang: post.id,
        // maBaiDangList: [post.id],
        loaiHoaDon: 'THUE_CAN_HO',
        soTien,
        ghiChu: `Thanh toán thuê căn hộ ${post.title}`,
      });

      navigate('/payment/sepay', {
        state: {
          ...payment,
          loaiHoaDon: 'THUE_CAN_HO',
          maBaiDang: post.id,
          // maBaiDangList: [post.id],
        },
      });
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
        'Không thể tạo thanh toán thuê căn hộ'
      );
    }
  };

  const handleChatWithOwner = async () => {
    const currentUserId = getAuthSession()?.user.maNguoiDung;
    if (!currentUserId) {
      alert('Vui lòng đăng nhập để nhắn tin với chủ nhà');
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (!post?.ownerId) {
      alert('Không tìm thấy thông tin chủ nhà.');
      return;
    }

    if (currentUserId === post.ownerId) {
      alert('Bạn không thể nhắn tin với chính mình.');
      return;
    }

    try {
      const room = await getOrCreateRoom({
        maNguoiDung1: currentUserId,
        maNguoiDung2: post.ownerId,
        maBaiDang: post.id,
        loaiPhongChat: 'USER_HOST',
      });
      navigate(`/chat?room=${room.maPhongChat}`);
    } catch (error: any) {
      console.error('Lỗi khi tạo phòng chat:', error);
      alert(
        error?.response?.data?.message ||
        'Không thể kết nối trò chuyện. Vui lòng thử lại sau!'
      );
    }
  };

  if (loading) {
    return (
      <div className="rental-detail-page">
        <div className="rental-detail-container">
          <div className="rental-detail-empty">
            <h2>Đang tải bài đăng</h2>
            <p>Hệ thống đang lấy thông tin chi tiết căn hộ.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="rental-detail-page">
        <div className="rental-detail-container">
          <div className="rental-detail-empty">
            <h2>Không tìm thấy bài đăng</h2>
            <p>{loadError || 'Tin đăng này không tồn tại hoặc đã bị gỡ khỏi hệ thống.'}</p>
            <button onClick={() => navigate('/posts')} className="rental-detail-back-btn">
              Quay về danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeGalleryImage = post.gallery[activeImage] || post.coverImage;
  const phoneHref = post.phone === 'Đang cập nhật' ? undefined : `tel:${post.phone}`;

  return (
    <div className="rental-detail-page">
      <div className="rental-detail-container">
        <div className="rental-detail-breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span onClick={() => navigate('/posts')}>Tin đăng</span>
          <span>/</span>
          <strong>{post.title}</strong>
        </div>

        <div className="rental-detail-layout">
          <div className="rental-detail-main">
            <section className="rental-detail-gallery-card">
              <div className="rental-detail-gallery-main-wrap">
                <img
                  src={activeGalleryImage}
                  alt={post.title}
                  className="rental-detail-gallery-main"
                />

                <div className="rental-detail-gallery-badges">
                  {post.isFeatured && (
                    <span className="rental-detail-badge rental-detail-badge--hot">
                      Nổi bật
                    </span>
                  )}
                  {post.isNew && (
                    <span className="rental-detail-badge rental-detail-badge--new">
                      Mới đăng
                    </span>
                  )}
                  {post.hasVideo && (
                    <span className="rental-detail-badge rental-detail-badge--video">
                      Có video
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`rental-detail-gallery-favorite-btn ${isFavorite ? 'active' : ''}`}
                  disabled={favoriteLoading}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? `♥ Đã lưu (${favoriteCount})` : `♡ Lưu tin (${favoriteCount})`}
                </button>
              </div>

              <div className="rental-detail-gallery-thumbs">
                {post.gallery.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={`rental-detail-thumb ${activeImage === index ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={img} alt={`${post.title}-${index + 1}`} />
                  </button>
                ))}
              </div>
            </section>

            {post.videoUrls.length > 0 && (
              <section className="rental-detail-video-card">
                <div className="rental-detail-video-header">
                  <h2>Video</h2>
                  <span>{post.videoUrls.length} video</span>
                </div>

                <div className="rental-detail-video-list">
                  {post.videoUrls.map((videoUrl, index) => (
                    <video
                      key={`${videoUrl}-${index}`}
                      className="rental-detail-video-player"
                      src={videoUrl}
                      controls
                      preload="metadata"
                      title={`Video ${index + 1} của ${post.title}`}
                    >
                      Trình duyệt không hỗ trợ phát video.
                    </video>
                  ))}
                </div>
              </section>
            )}

            <section className="rental-detail-content-card">
              <div className="rental-detail-header">
                <div className="rental-detail-header-left">
                  <h1 className="rental-detail-title">{post.title}</h1>

                  <div className="rental-detail-meta-row">
                    <div className="rental-detail-price">{post.priceText}</div>
                    <div className="rental-detail-meta-chip">{post.areaText}</div>
                    <div className="rental-detail-meta-chip">{post.wardText}</div>
                    <div className="rental-detail-meta-chip">{post.categoryLabel}</div>
                  </div>

                  <p className="rental-detail-address">{post.addressText}</p>
                </div>
              </div>

              <div className="rental-detail-info-grid">
                {detailItems.map((item) => (
                  <div key={item.label} className="rental-detail-info-item">
                    <span className="rental-detail-info-label">{item.label}</span>
                    <strong className="rental-detail-info-value">{item.value}</strong>
                  </div>
                ))}
              </div>

              {post.tags.length > 0 && (
                <div className="rental-detail-section">
                  <h3 className="rental-detail-section-title">Từ khóa nổi bật</h3>
                  <div className="rental-detail-tag-list">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rental-detail-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rental-detail-section">
                <h3 className="rental-detail-section-title">Mô tả chi tiết</h3>
                <p className="rental-detail-description">{post.description}</p>
              </div>

              {post.amenities.length > 0 && (
                <div className="rental-detail-section">
                  <h3 className="rental-detail-section-title">Tiện ích</h3>
                  <div className="rental-detail-amenities">
                    {post.amenities.map((item) => (
                      <div key={item} className="rental-detail-amenity">
                        <span className="rental-detail-amenity-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="rental-detail-sidebar">
            <div className="rental-detail-owner-card">
              <div className="rental-detail-owner-avatar">
                {post.ownerAvatar ? (
                  <img src={post.ownerAvatar} alt={post.postedBy} />
                ) : (
                  post.postedBy.charAt(0).toUpperCase() || 'C'
                )}
              </div>

              <div className="rental-detail-owner-content">
                <p className="rental-detail-owner-label">Người đăng</p>
                <h3 className="rental-detail-owner-name">{post.postedBy}</h3>
                <p className="rental-detail-owner-subtext">
                  Tin đăng đang hoạt động, phản hồi nhanh
                </p>
              </div>

              <div className="rental-detail-owner-actions">
                <a href={phoneHref} className="rental-detail-btn rental-detail-btn--call">
                  Gọi ngay
                </a>

                <button
                  type="button"
                  className="rental-detail-btn rental-detail-btn--zalo"
                >
                  Nhắn Zalo
                </button>

                {maNguoiDung !== post?.ownerId && (
                  <button
                    type="button"
                    className="rental-detail-btn rental-detail-btn--chat"
                    onClick={handleChatWithOwner}
                  >
                    Nhắn tin chủ nhà
                  </button>
                )}

                <button
                  type="button"
                  className="rental-detail-btn rental-detail-btn--primary"
                  onClick={handleRentApartment}
                >
                  Thanh toán / Đặt cọc
                </button>
              </div>

              <div className="rental-detail-owner-note">
                Ưu tiên người thuê thiện chí, có thể giữ chỗ nhanh sau khi thanh toán.
              </div>
            </div>

            <div className="rental-detail-side-card">
              <h4 className="rental-detail-side-title">Cam kết hiển thị</h4>
              <ul className="rental-detail-side-list">
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
