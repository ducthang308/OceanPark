import './RoomList.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import fallbackRoomImage from '../../assets/img/co4la.png';
import {
  addFavoritePost,
  getApartmentDetailByPost,
  getCategories,
  getFavoriteCountByPost,
  getFavoritePostsByUser,
  getPostImages,
  getPosts,
  removeFavoritePost,
} from '../../services/api/PostManagementService';
import type {
  BaiDangDTO,
  ChiTietCanHoDTO,
  DanhMucDTO,
  HinhAnhBaiDangDTO,
} from '../../services/api/PostManagementService';
import {
  AREA_RANGE_OPTIONS,
  DEFAULT_HOME_CATEGORIES,
  DISTRICT_OPTIONS,
  HOME_DEFAULT_STATS,
  HOME_STATIC_CONTENT,
  PRICE_RANGE_OPTIONS,
  createListingPath,
  findRangeOption,
  isNumberInRange,
  normalizeText,
  resolveDistrictId,
  slugify,
} from '../../services/api/HomeService';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

const POSTS_PER_PAGE = 3;
const HIDDEN_POST_STATUSES = new Set(['HIDDEN', 'PENDING', 'CHO_DUYET', 'TU_CHOI', 'DELETED']);

type RoomTab = 'proposal' | 'new' | 'video';

interface RoomCategory {
  id: string;
  label: string;
  slug: string;
  description: string;
}

interface RoomPostCard {
  id: string;
  title: string;
  priceText: string;
  areaText: string;
  addressText: string;
  wardText: string;
  categoryLabel: string;
  categorySlug: string;
  description: string;
  coverImage: string;
  gallery: string[];
  postedBy: string;
  postedAtText: string;
  phone: string;
  hasVideo: boolean;
  isFeatured: boolean;
  isNew: boolean;
  createdAtTime: number;
  price: number | null;
  area: number | null;
  districtId?: string;
  likeCount?: number;
}

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Liên hệ';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)}đ/tháng`;
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

const getDateTime = (value?: string) => {
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const defaultCategories: RoomCategory[] = DEFAULT_HOME_CATEGORIES.map((category) => ({
  id: category.key,
  label: category.label,
  slug: category.slug,
  description: category.description,
}));

const mapCategoryDto = (category: DanhMucDTO): RoomCategory => {
  const label = category.tenDanhMuc || category.maDanhMuc || 'Danh mục';

  return {
    id: category.maDanhMuc,
    label,
    slug: slugify(label),
    description: `Khám phá ${label.toLowerCase()} phù hợp nhu cầu của bạn`,
  };
};

const createCategoryLookup = (categories: RoomCategory[]) => {
  const lookup = new Map<string, RoomCategory>();

  defaultCategories.forEach((category, index) => {
    lookup.set(category.id, category);
    lookup.set(category.slug, category);
    lookup.set(String(index + 1), category);
    lookup.set(`DM${index + 1}`, category);
  });

  categories.forEach((category) => {
    lookup.set(category.id, category);
    lookup.set(category.slug, category);
  });

  return lookup;
};

const isPublicPost = (post: BaiDangDTO) => {
  const status = post.trangThai?.trim().toUpperCase();
  return !status || !HIDDEN_POST_STATUSES.has(status);
};

const getImageUrl = (image: HinhAnhBaiDangDTO) =>
  image.thumbnailUrl?.trim() || image.duongDan?.trim() || '';

const hasVideoAsset = (images: HinhAnhBaiDangDTO[]) =>
  images.some((image) => {
    const type = (image.loai || '').toUpperCase();
    const path = `${image.duongDan || ''} ${image.thumbnailUrl || ''}`.toLowerCase();

    return type.includes('VIDEO') || /\.(mp4|mov|webm|avi)(\?|$)/i.test(path);
  });

const buildPostCard = (
  post: BaiDangDTO,
  detail: ChiTietCanHoDTO | null,
  images: HinhAnhBaiDangDTO[],
  categoryLookup: Map<string, RoomCategory>,
  index: number,
): RoomPostCard => {
  const category = post.maDanhMuc ? categoryLookup.get(post.maDanhMuc) : undefined;
  const sortedImages = [...images].sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0));
  const gallery = sortedImages.map(getImageUrl).filter(Boolean);
  const price = typeof detail?.gia === 'number' ? detail.gia : null;
  const area = typeof detail?.dienTich === 'number' ? detail.dienTich : null;
  const wardText = detail?.phuong?.trim() || 'Đang cập nhật';
  const addressText =
    [detail?.diaChiCuThe, detail?.phuong].filter(Boolean).join(', ') ||
    'Đang cập nhật địa chỉ';

  return {
    id: post.maBaiDang?.trim() || `post-${index + 1}`,
    title: post.tieuDe?.trim() || 'Bài đăng chưa có tiêu đề',
    priceText: formatCurrency(price ?? undefined),
    areaText: formatArea(area ?? undefined),
    addressText,
    wardText,
    categoryLabel: category?.label || 'Danh mục',
    categorySlug: category?.slug || 'danh-muc',
    description: post.noiDung?.trim() || 'Chưa có mô tả chi tiết.',
    coverImage: gallery[0] || fallbackRoomImage,
    gallery: gallery.length > 0 ? gallery : [fallbackRoomImage],
    postedBy: 'Chủ nhà',
    postedAtText: formatPostedAt(post.ngayDang),
    phone: post.lienHe?.trim() || 'Đang cập nhật',
    hasVideo: hasVideoAsset(images),
    isFeatured: false,
    isNew: false,
    createdAtTime: getDateTime(post.ngayDang),
    price,
    area,
    districtId: resolveDistrictId(addressText, wardText),
    likeCount: 0,
  };
};

const RoomList: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<RoomTab>('proposal');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteActionIds, setFavoriteActionIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postList, setPostList] = useState<RoomPostCard[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<RoomCategory[]>(defaultCategories);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const maNguoiDung = localStorage.getItem('userId');

  const {
    open,
    close,
    loading,
    initialValues,
    submit,
  } = useUserNeedDialog(maNguoiDung);

  const queryDistrict = searchParams.get('district') || 'all';
  const activeDistrict = DISTRICT_OPTIONS.some((district) => district.id === queryDistrict)
    ? queryDistrict
    : 'all';
  const activePriceRangeId = searchParams.get('price') || '';
  const activeAreaRangeId = searchParams.get('area') || '';

  useEffect(() => {
    let ignore = false;

    const loadPosts = async () => {
      setPostsLoading(true);
      setPostsError('');

      try {
        const [postsResponse, categoriesResponse] = await Promise.all([
          getPosts(),
          getCategories().catch(() => [] as DanhMucDTO[]),
        ]);

        if (ignore) return;

        const apiCategories = categoriesResponse.map(mapCategoryDto);
        const resolvedCategories = apiCategories.length > 0 ? apiCategories : defaultCategories;
        const categoryLookup = createCategoryLookup(resolvedCategories);

        setCategoryOptions(resolvedCategories);

        const mappedPosts = await Promise.all(
          postsResponse.filter(isPublicPost).map(async (post, index) => {
            const maBaiDang = post.maBaiDang?.trim();
            let detail: ChiTietCanHoDTO | null = null;
            let images: HinhAnhBaiDangDTO[] = [];
            let likeCount = 0;

            if (maBaiDang) {
              [detail, images, likeCount] = await Promise.all([
                getApartmentDetailByPost(maBaiDang).catch(() => null),
                getPostImages(maBaiDang).catch(() => [] as HinhAnhBaiDangDTO[]),
                getFavoriteCountByPost(maBaiDang).catch(() => 0),
              ]);
            }

            return {
              ...buildPostCard(post, detail, images, categoryLookup, index),
              likeCount,
            };
          }),
        );

        if (ignore) return;

        const sortedPosts = mappedPosts
          .sort((a, b) => b.createdAtTime - a.createdAtTime)
          .map((post, index) => ({
            ...post,
            isFeatured: index < 3,
            isNew: index < 5,
          }));

        setPostList(sortedPosts);
      } catch {
        if (ignore) return;

        setPostList([]);
        setPostsError('Không tải được danh sách bài đăng. Vui lòng thử lại.');
      } finally {
        if (!ignore) {
          setPostsLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let ignore = false;

    const loadFavoriteIds = async () => {
      if (!maNguoiDung) {
        setFavoriteIds([]);
        return;
      }

      try {
        const favoritesResponse = await getFavoritePostsByUser(maNguoiDung);
        const ids = Array.from(
          new Set(
            favoritesResponse
              .map((favorite) => favorite.maBaiDang?.trim())
              .filter((postId): postId is string => Boolean(postId)),
          ),
        );

        if (!ignore) {
          setFavoriteIds(ids);
        }
      } catch {
        if (!ignore) {
          setFavoriteIds([]);
        }
      }
    };

    loadFavoriteIds();

    return () => {
      ignore = true;
    };
  }, [maNguoiDung]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, activeDistrict, activePriceRangeId, activeAreaRangeId]);

  const activeCategory = useMemo(
    () => categoryOptions.find((category) => category.slug === slug),
    [categoryOptions, slug],
  );

  const categoryFilteredPosts = useMemo(() => {
    if (!slug) return postList;
    return postList.filter((post) => post.categorySlug === slug);
  }, [postList, slug]);

  const districtOptions = useMemo(
    () =>
      DISTRICT_OPTIONS.map((district) => {
        if (district.id === 'all') {
          return {
            ...district,
            postCount: categoryFilteredPosts.length,
          };
        }

        return {
          ...district,
          postCount: categoryFilteredPosts.filter((post) => post.districtId === district.id)
            .length,
        };
      }),
    [categoryFilteredPosts],
  );

  const districtFilteredPosts = useMemo(() => {
    if (activeDistrict === 'all') return categoryFilteredPosts;

    const district = DISTRICT_OPTIONS.find((item) => item.id === activeDistrict);
    if (!district) return categoryFilteredPosts;

    const districtName = normalizeText(district.name);

    return categoryFilteredPosts.filter((post) =>
      post.districtId === activeDistrict ||
      normalizeText(`${post.addressText} ${post.wardText}`).includes(districtName),
    );
  }, [activeDistrict, categoryFilteredPosts]);

  const priceRange = useMemo(
    () => findRangeOption(PRICE_RANGE_OPTIONS, activePriceRangeId),
    [activePriceRangeId],
  );
  const areaRange = useMemo(
    () => findRangeOption(AREA_RANGE_OPTIONS, activeAreaRangeId),
    [activeAreaRangeId],
  );

  const filteredPosts = useMemo(
    () =>
      districtFilteredPosts.filter(
        (post) =>
          isNumberInRange(post.price, priceRange) && isNumberInRange(post.area, areaRange),
      ),
    [areaRange, districtFilteredPosts, priceRange],
  );

  const visibleFeaturedPosts = useMemo(() => {
    const sortedPosts = [...filteredPosts].sort((a, b) => {
      if (activeTab === 'proposal') {
        return Number(b.isFeatured) - Number(a.isFeatured) || b.createdAtTime - a.createdAtTime;
      }

      return b.createdAtTime - a.createdAtTime;
    });

    if (activeTab === 'video') {
      return sortedPosts.filter((item) => item.hasVideo);
    }

    return sortedPosts;
  }, [activeTab, filteredPosts]);

  const newestPosts = useMemo(
    () => [...postList].sort((a, b) => b.createdAtTime - a.createdAtTime).slice(0, 5),
    [postList],
  );

  const heroStats = useMemo(
    () =>
      HOME_DEFAULT_STATS.map((item, index) =>
        index === 0
          ? {
              ...item,
              value: postsLoading ? '...' : String(postList.length),
            }
          : item,
      ),
    [postList.length, postsLoading],
  );

  const totalPages = Math.ceil(visibleFeaturedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = visibleFeaturedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleTabChange = (tab: RoomTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const updateSearchFilter = (key: 'district' | 'price' | 'area', value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!value || value === 'all') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const toggleFavorite = async (postId: string) => {
    if (!maNguoiDung) {
      navigate('/login');
      return;
    }

    if (favoriteActionIds.includes(postId)) return;

    setFavoriteActionIds((prev) => [...prev, postId]);

    try {
      const isFavorite = favoriteIds.includes(postId);

      if (isFavorite) {
        await removeFavoritePost(maNguoiDung, postId);
      } else {
        await addFavoritePost(maNguoiDung, postId);
      }
    } catch {
      // Trạng thái có thể đã thay đổi ở tab khác; phần bên dưới sẽ lấy lại dữ liệu thật.
    }

    try {
      const [favoritesResponse, likeCountResponse] = await Promise.all([
        getFavoritePostsByUser(maNguoiDung),
        getFavoriteCountByPost(postId),
      ]);
      const ids = Array.from(
        new Set(
          favoritesResponse
            .map((favorite) => favorite.maBaiDang?.trim())
            .filter((id): id is string => Boolean(id)),
        ),
      );

      setFavoriteIds(ids);
      setPostList((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likeCount: likeCountResponse,
              }
            : post,
        ),
      );
      window.dispatchEvent(new Event('favorite-posts:changed'));
    } catch {
      setReloadKey((value) => value + 1);
    } finally {
      setFavoriteActionIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  const getLikeCount = (post: RoomPostCard) => post.likeCount ?? 0;
  const currentCategorySlug = activeCategory?.slug || slug;

  return (
    <>
      <main className="room-list-page">
        <section className="room-list-hero">
          <div className="room-list-hero__overlay" />
          <div className="room-list-hero__container">
            <div className="room-list-hero__content">
              <p className="room-list-hero__eyebrow">Nền tảng cho thuê nổi bật tại Đà Nẵng</p>
              <h1>{HOME_STATIC_CONTENT.heroTitle}</h1>
              <p className="room-list-hero__description">{HOME_STATIC_CONTENT.heroSubtitle}</p>

              <div className="room-list-hero__actions">
                <Link to="/danh-muc/phong-tro" className="room-list-btn room-list-btn--primary">
                  Khám phá tin thuê
                </Link>
                <Link to="/service-price" className="room-list-btn room-list-btn--ghost">
                  Xem bảng giá
                </Link>
              </div>

              <div className="room-list-hero__stats">
                {heroStats.map((item) => (
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
            {categoryOptions.map((category, index) => (
              <Link
                key={category.id}
                to={`/danh-muc/${category.slug}`}
                className="room-list-category-card"
              >
                <div className="room-list-category-card__top">
                  <span className="room-list-category-card__index">
                    {String(index + 1).padStart(2, '0')}
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
            {districtOptions.map((district) => (
              <button
                key={district.id}
                type="button"
                className={`room-list-district-chip ${
                  activeDistrict === district.id ? 'is-active' : ''
                }`}
                onClick={() => updateSearchFilter('district', district.id)}
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
                  <span>{activeCategory ? 'Danh mục đang xem' : 'Gợi ý dành cho bạn'}</span>
                  <h2>{activeCategory?.label || 'Tin nổi bật theo nhu cầu tìm kiếm'}</h2>
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
                {postsLoading ? (
                  <div className="room-list-state">
                    <h3>Đang tải bài đăng</h3>
                    <p>Hệ thống đang lấy dữ liệu bài đăng mới nhất.</p>
                  </div>
                ) : postsError ? (
                  <div className="room-list-state">
                    <h3>Không tải được bài đăng</h3>
                    <p>{postsError}</p>
                    <button
                      type="button"
                      className="room-list-state__retry"
                      onClick={() => setReloadKey((value) => value + 1)}
                    >
                      Tải lại
                    </button>
                  </div>
                ) : paginatedPosts.length > 0 ? (
                  paginatedPosts.map((item) => {
                    const isFavorite = favoriteIds.includes(item.id);
                    const isFavoriteProcessing = favoriteActionIds.includes(item.id);
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
                            src={item.coverImage}
                            alt={item.title}
                          />
                          <div className="room-list-featured-card__overlay-meta">
                            <span className="room-list-badge">{item.categoryLabel}</span>
                            {item.isFeatured && (
                              <span className="room-list-badge room-list-badge--light">
                                Nổi bật
                              </span>
                            )}
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
                              disabled={isFavoriteProcessing}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
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
                              <span>{likeCount}</span>
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="room-list-state">
                    <h3>Chưa có bài đăng phù hợp</h3>
                    <p>Thử chọn danh mục hoặc khu vực khác để xem thêm tin đăng.</p>
                  </div>
                )}
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
                  {PRICE_RANGE_OPTIONS.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={createListingPath({
                          categorySlug: currentCategorySlug,
                          districtId: activeDistrict,
                          priceRangeId: item.id,
                          areaRangeId: activeAreaRangeId,
                        })}
                        className={activePriceRangeId === item.id ? 'is-active' : undefined}
                      >
                        {item.label}
                      </Link>
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
                  {AREA_RANGE_OPTIONS.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={createListingPath({
                          categorySlug: currentCategorySlug,
                          districtId: activeDistrict,
                          priceRangeId: activePriceRangeId,
                          areaRangeId: item.id,
                        })}
                        className={activeAreaRangeId === item.id ? 'is-active' : undefined}
                      >
                        {item.label}
                      </Link>
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
                  {postsLoading ? (
                    <div className="room-list-sidebar-empty">Đang tải tin mới...</div>
                  ) : newestPosts.length > 0 ? (
                    newestPosts.map((post) => {
                      const isFavorite = favoriteIds.includes(post.id);
                      const isFavoriteProcessing = favoriteActionIds.includes(post.id);
                      const likeCount = getLikeCount(post);

                      return (
                        <Link
                          key={post.id}
                          to={`/posts/${post.id}`}
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
                                disabled={isFavoriteProcessing}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
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
                                <span>{likeCount}</span>
                              </button>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="room-list-sidebar-empty">Chưa có tin mới.</div>
                  )}
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
