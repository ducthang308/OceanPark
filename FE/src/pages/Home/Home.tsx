import './Home.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BankOutlined,
  BellOutlined,
  BulbOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FireFilled,
  HeartFilled,
  HeartOutlined,
  HomeOutlined,
  MessageOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import {
  createDefaultHomePageData,
  createListingPath,
  getHomePageData,
  getRecommendedHomePosts,
  normalizeText,
} from '../../services/api/HomeService';
import type { IHomeCategory, IHomePageData, IHomePostCard } from '../../services/types/home.types';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import { useAuth } from '../../hooks/useAuth';
import { LANDLORD_ROLE_IDS } from '../../constants/roles';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

type FeaturedTab = 'featured' | 'newest' | 'budget' | 'large';
type RecommendationTab = 'match' | 'price' | 'location' | 'ai';
type NeedPreferenceKey =
  | 'dayDuNoiThat'
  | 'coMayLanh'
  | 'coThangMay'
  | 'coMayGiat'
  | 'coNhaXe'
  | 'coTuLanh'
  | 'gioGiacTuDo'
  | 'coBanCong'
  | 'ganTrungTam'
  | 'ganBien';

interface SearchFilters {
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
}

interface HomeWard {
  id: string;
  name: string;
  postCount: number;
  averagePrice: string;
  badge: string;
}

const categoryIconMap: Record<string, React.ReactNode> = {
  'phong-tro': <HomeOutlined />,
  'can-ho-cao-cap': <BankOutlined />,
  'can-ho-chung-cu': <BankOutlined />,
  'nha-nguyen-can': <HomeOutlined />,
  'can-ho-o-ghep': <TeamOutlined />,
  'can-ho-mini': <HomeOutlined />,
  'mat-bang-cho-thue': <ShopOutlined />,
};

const featuredTabs: Array<{ key: FeaturedTab; label: string }> = [
  { key: 'featured', label: 'Nổi bật' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'budget', label: 'Giá rẻ' },
  { key: 'large', label: 'Diện tích lớn' },
];

const recommendationTabs: Array<{ key: RecommendationTab; label: string }> = [
  { key: 'match', label: 'Match nhu cầu' },
  { key: 'price', label: 'Theo giá' },
  { key: 'location', label: 'Theo khu vực' },
];

const needPreferenceLabels: Array<{ key: NeedPreferenceKey; label: string }> = [
  { key: 'dayDuNoiThat', label: 'Đầy đủ nội thất' },
  { key: 'coMayLanh', label: 'Máy lạnh' },
  { key: 'coThangMay', label: 'Thang máy' },
  { key: 'coMayGiat', label: 'Máy giặt' },
  { key: 'coNhaXe', label: 'Nhà xe' },
  { key: 'coTuLanh', label: 'Tủ lạnh' },
  { key: 'gioGiacTuDo', label: 'Giờ giấc tự do' },
  { key: 'coBanCong', label: 'Ban công' },
  { key: 'ganTrungTam', label: 'Gần trung tâm' },
  { key: 'ganBien', label: 'Gần biển' },
];

const getPostPrice = (post: IHomePostCard) =>
  typeof post.price === 'number' ? post.price : Number.MAX_SAFE_INTEGER;

const getPostArea = (post: IHomePostCard) =>
  typeof post.area === 'number' ? post.area : 0;

const formatCompactCurrency = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return 'Đang cập nhật';
  if (value >= 1_000_000) {
    const million = value / 1_000_000;
    return `${Number.isInteger(million) ? million : million.toFixed(1)} triệu`;
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
};

const formatNeedCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '';
  return formatCompactCurrency(value);
};

const formatNeedPriceRange = (minPrice?: number | null, maxPrice?: number | null) => {
  const minText = formatNeedCurrency(minPrice);
  const maxText = formatNeedCurrency(maxPrice);

  if (minText && maxText) return `${minText} - ${maxText}`;
  if (minText) return `từ ${minText}`;
  if (maxText) return `đến ${maxText}`;

  return '';
};

const getUniquePosts = (posts: IHomePostCard[]) =>
  posts.filter((post, index, arr) => arr.findIndex((item) => String(item.id) === String(post.id)) === index);

const getCategoryCount = (category: IHomeCategory, posts: IHomePostCard[]) =>
  posts.filter((post) => post.categorySlug === category.slug).length;

const getWardKey = (wardText: string) =>
  normalizeText(wardText || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'phuong';

const buildPopularWards = (posts: IHomePostCard[]): HomeWard[] => {
  const wardMap = new Map<string, { name: string; posts: IHomePostCard[] }>();

  posts.forEach((post) => {
    const wardName = post.wardText?.trim();

    if (!wardName || normalizeText(wardName).includes('dang cap nhat')) return;

    const key = getWardKey(wardName);
    const current = wardMap.get(key);

    if (current) {
      current.posts.push(post);
    } else {
      wardMap.set(key, {
        name: wardName,
        posts: [post],
      });
    }
  });

  return Array.from(wardMap.entries())
    .map(([id, item]) => {
      const prices = item.posts
        .map((post) => post.price)
        .filter((price): price is number => typeof price === 'number' && price > 0);
      const averagePrice = prices.length
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : null;
      const hasNewPost = item.posts.some((post) => post.isNew);

      return {
        id,
        name: item.name,
        postCount: item.posts.length,
        averagePrice: formatCompactCurrency(averagePrice),
        badge: hasNewPost ? 'Có tin mới' : '',
      };
    })
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6)
    .map((ward, index) => ({
      ...ward,
      badge: index === 0 ? 'Nhiều tin' : ward.badge,
    }));
};

const dataSourceCards = [
  {
    title: 'Thông tin căn hộ rõ ràng',
    description: 'Giá, diện tích, địa chỉ và ngày đăng được lấy từ dữ liệu bài đăng và chi tiết căn hộ.',
  },
  {
    title: 'Hình ảnh theo từng tin',
    description: 'Ảnh đại diện và thư viện được hiển thị từ dữ liệu hình ảnh của từng bài đăng.',
  },
  {
    title: 'Lượt lưu minh bạch',
    description: 'Số lượt lưu trên mỗi tin được lấy từ danh sách yêu thích hiện có trong hệ thống.',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, roleId, user } = useAuth();
  const [homeData, setHomeData] = useState<IHomePageData>(() => createDefaultHomePageData());
  const [homeLoading, setHomeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeaturedTab>('featured');
  const [recommendationTab, setRecommendationTab] = useState<RecommendationTab>('match');
  const [recommendedPosts, setRecommendedPosts] = useState<IHomePostCard[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<Array<string | number>>([]);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [showPriceRangeError, setShowPriceRangeError] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    categorySlug: '',
    minPrice: '0',
    maxPrice: '',
    minArea: '',
  });
  const maNguoiDung = user?.maNguoiDung ?? null;
  const canViewServicePrice = Boolean(roleId && LANDLORD_ROLE_IDS.includes(roleId));
  const canManageUserNeed = Boolean(maNguoiDung && !canViewServicePrice);
  const minPriceValue = Number(searchFilters.minPrice);
  const maxPriceValue = Number(searchFilters.maxPrice);
  const hasMinPriceValue =
    searchFilters.minPrice.trim() !== '' && Number.isFinite(minPriceValue);
  const hasMaxPriceValue =
    searchFilters.maxPrice.trim() !== '' && Number.isFinite(maxPriceValue);
  const hasPriceRangeError =
    hasMinPriceValue && hasMaxPriceValue && minPriceValue >= maxPriceValue;
  const shouldShowPriceRangeError = showPriceRangeError && hasPriceRangeError;

  const {
    open,
    close,
    loading,
    hasNeed,
    initialValues,
    openDialog,
    submit,
  } = useUserNeedDialog(canManageUserNeed ? maNguoiDung : null);

  useEffect(() => {
    let ignore = false;

    const loadHomeData = async () => {
      setHomeLoading(true);

      try {
        const data = await getHomePageData();
        if (!ignore) setHomeData(data);
      } catch {
        if (!ignore) setHomeData(createDefaultHomePageData());
      } finally {
        if (!ignore) setHomeLoading(false);
      }
    };

    loadHomeData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadRecommendations = async () => {
      if (!canManageUserNeed || !hasNeed || !maNguoiDung) {
        setRecommendedPosts([]);
        setRecommendationLoading(false);
        return;
      }

      setRecommendationLoading(true);

      try {
        const data = await getRecommendedHomePosts(maNguoiDung);
        if (!ignore) setRecommendedPosts(data);
      } catch (error) {
        console.error(error);
        if (!ignore) setRecommendedPosts([]);
      } finally {
        if (!ignore) setRecommendationLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      ignore = true;
    };
  }, [canManageUserNeed, hasNeed, maNguoiDung, initialValues]);

  const allHomePosts = useMemo(
    () =>
      homeData.allPosts.length > 0
        ? homeData.allPosts
        : getUniquePosts([...homeData.featuredPosts, ...homeData.newestPosts]),
    [homeData.allPosts, homeData.featuredPosts, homeData.newestPosts],
  );
  const featuredPosts = useMemo(() => {
    const sourcePosts = allHomePosts.length > 0 ? allHomePosts : homeData.featuredPosts;

    if (activeTab === 'newest') {
      return [...sourcePosts]
        .sort((a, b) => (b.createdAtTime ?? 0) - (a.createdAtTime ?? 0))
        .slice(0, 3);
    }

    if (activeTab === 'budget') {
      return [...sourcePosts].sort((a, b) => getPostPrice(a) - getPostPrice(b)).slice(0, 3);
    }

    if (activeTab === 'large') {
      return [...sourcePosts].sort((a, b) => getPostArea(b) - getPostArea(a)).slice(0, 3);
    }

    return homeData.featuredPosts.slice(0, 3);
  }, [activeTab, allHomePosts, homeData.featuredPosts]);
  const newestPosts = homeData.newestPosts.slice(0, 3);
  const popularWards = useMemo(() => buildPopularWards(allHomePosts), [allHomePosts]);
  const stats = useMemo(
    () =>
      homeData.stats.map((item, index) =>
        index === 0 && homeLoading
          ? {
              ...item,
              value: '...',
            }
          : item,
      ),
    [homeData.stats, homeLoading],
  );
  const dealPosts = useMemo(
    () =>
      allHomePosts
        .filter((post) => typeof post.price === 'number' && post.price > 0)
        .sort((a, b) => getPostPrice(a) - getPostPrice(b))
        .slice(0, 3),
    [allHomePosts],
  );
  const needSummaryChips = useMemo(() => {
    const chips: string[] = [];
    const priceRangeText = formatNeedPriceRange(initialValues?.minPrice, initialValues?.maxPrice);

    if (priceRangeText) chips.push(`Giá ${priceRangeText}`);
    if (initialValues?.phuong) chips.push(`Khu vực ${initialValues.phuong}`);
    if (initialValues?.loaiCanHo) chips.push(initialValues.loaiCanHo);

    needPreferenceLabels
      .filter((item) => Boolean(initialValues?.[item.key]))
      .slice(0, 4)
      .forEach((item) => chips.push(item.label));

    return chips;
  }, [initialValues]);
  const recommendationPostsToShow = useMemo(() => {
    const matchesNeedPrice = (post: IHomePostCard) => {
      const minPrice = initialValues?.minPrice;
      const maxPrice = initialValues?.maxPrice;

      if (!minPrice && !maxPrice) return true;
      if (typeof post.price !== 'number') return false;

      const aboveMin = typeof minPrice !== 'number' || post.price >= minPrice;
      const belowMax = typeof maxPrice !== 'number' || post.price <= maxPrice;

      return aboveMin && belowMax;
    };
    const matchesNeedLocation = (post: IHomePostCard) => {
      const ward = initialValues?.phuong?.trim();
      if (!ward) return true;

      return normalizeText(`${post.wardText} ${post.addressText}`).includes(normalizeText(ward));
    };
    const byScore = (a: IHomePostCard, b: IHomePostCard) =>
      (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);

    if (recommendationTab === 'price') {
      return [...recommendedPosts]
        .filter(matchesNeedPrice)
        .sort((a, b) => getPostPrice(a) - getPostPrice(b))
        .slice(0, 3);
    }

    if (recommendationTab === 'location') {
      return [...recommendedPosts]
        .filter(matchesNeedLocation)
        .sort(byScore)
        .slice(0, 3);
    }

    if (recommendationTab === 'ai') {
      return [...recommendedPosts]
        .filter((post) => Boolean(post.aiSuggestion))
        .sort(byScore)
        .slice(0, 3);
    }

    return [...recommendedPosts].sort(byScore).slice(0, 3);
  }, [initialValues, recommendationTab, recommendedPosts]);

  const updateSearchFilter = (key: keyof SearchFilters, value: string) => {
    if (key === 'minPrice' || key === 'maxPrice') {
      setShowPriceRangeError(false);
    }

    setSearchFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowPriceRangeError(true);

    if (hasPriceRangeError) return;

    setShowPriceRangeError(false);

    const path = searchFilters.categorySlug
      ? `/danh-muc/${searchFilters.categorySlug}`
      : '/posts';
    const params = new URLSearchParams();
    const minArea = Number(searchFilters.minArea);

    if (Number.isFinite(minPriceValue) && minPriceValue > 0) {
      params.set('minPrice', String(minPriceValue * 1_000_000));
    }
    if (Number.isFinite(maxPriceValue) && maxPriceValue > 0) {
      params.set('maxPrice', String(maxPriceValue * 1_000_000));
    }
    if (Number.isFinite(minArea) && minArea > 0) params.set('minArea', String(minArea));

    const query = params.toString();
    navigate(query ? `${path}?${query}` : path);
  };

  const toggleSavedPost = (postId: string | number) => {
    if (!isAuthenticated || !maNguoiDung) {
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

    setSavedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  };

  const renderPostCard = (post: IHomePostCard, showRecommendation = false) => (
    <Link
      key={post.id}
      to={`/posts/${post.id}`}
      className={`site-home-post ${showRecommendation ? 'site-home-post--recommendation' : ''}`}
    >
      <div className="site-home-post__image-wrap">
        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
        {showRecommendation && typeof post.recommendationScore === 'number' && (
          <span className="site-home-post__score">{post.recommendationScore}% match</span>
        )}
        <span className="site-home-post__favorite-count">
          <HeartFilled />
          {post.likeCount ?? 0}
        </span>
        <button
          type="button"
          className={`site-home-save-btn ${savedPostIds.includes(post.id) ? 'is-saved' : ''}`}
          aria-label="Lưu tin"
          onClick={(event) => {
            event.preventDefault();
            toggleSavedPost(post.id);
          }}
        >
          {savedPostIds.includes(post.id) ? <HeartFilled /> : <HeartOutlined />}
        </button>
      </div>
      <div className="site-home-post__body">
        <span>{post.categoryLabel}</span>
        <h3>{post.title}</h3>
        <p>{post.addressText}</p>
        <div className="site-home-post__meta">
          <strong>{post.priceText}</strong>
          <small>{post.areaText}</small>
        </div>
        {showRecommendation && post.recommendationReasons && post.recommendationReasons.length > 0 && (
          <div className="site-home-post__reasons">
            {post.recommendationReasons.slice(0, 3).map((reason) => (
              <small key={reason}>{reason}</small>
            ))}
          </div>
        )}
        {showRecommendation && post.aiSuggestion && (
          <div className="site-home-post__ai">
            <BulbOutlined />
            <span>{post.aiSuggestion}</span>
          </div>
        )}
        <div className="site-home-post__signals">
          <small>{post.postedAtText}</small>
          <small>{post.likeCount ?? 0} lượt lưu</small>
          {post.hasVideo && <small>Có video</small>}
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <main className="site-home-page">
        <section className="site-home-hero">
          <div className="site-home-hero__overlay" />

          <div className="site-home-hero__container">
            <div className="site-home-hero__content">
              <p className="site-home-eyebrow">Nền tảng cho thuê nổi bật tại Đà Nẵng</p>
              <h1>{homeData.heroTitle}</h1>
              <p className="site-home-hero__description">{homeData.heroSubtitle}</p>

              <div className="site-home-hero__actions">
                <Link to="/danh-muc/phong-tro" className="site-home-btn site-home-btn--primary">
                  Khám phá tin thuê
                </Link>
                {canManageUserNeed && hasNeed && (
                  <button
                    type="button"
                    className="site-home-btn site-home-btn--ghost"
                    onClick={() => void openDialog()}
                  >
                    <EditOutlined />
                    Sửa nhu cầu
                  </button>
                )}
                {canViewServicePrice && (
                  <Link to="/service-price" className="site-home-btn site-home-btn--ghost">
                    Xem bảng giá
                  </Link>
                )}
              </div>

              <form className="site-home-search" onSubmit={handleSearchSubmit}>
                <div className="site-home-search__field site-home-search__field--wide">
                  <label htmlFor="home-category">Loại hình</label>
                  <select
                    id="home-category"
                    value={searchFilters.categorySlug}
                    onChange={(event) => updateSearchFilter('categorySlug', event.target.value)}
                  >
                    <option value="">Tất cả loại hình</option>
                    {homeData.categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="site-home-search__field">
                  <label htmlFor="home-min-price">Giá từ</label>
                  <div className="site-home-price-input">
                    <input
                      id="home-min-price"
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="0"
                      title="Mỗi lần tăng/giảm là 500.000đ"
                      value={searchFilters.minPrice}
                      onChange={(event) => updateSearchFilter('minPrice', event.target.value)}
                    />
                    <span>Triệu</span>
                  </div>
                </div>

                <div
                  className={`site-home-search__field ${
                    shouldShowPriceRangeError ? 'site-home-search__field--error' : ''
                  }`}
                >
                  <label htmlFor="home-max-price">Giá đến</label>
                  <div className="site-home-price-input">
                    <input
                      id="home-max-price"
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="0"
                      title="Mỗi lần tăng/giảm là 500.000đ"
                      value={searchFilters.maxPrice}
                      aria-invalid={shouldShowPriceRangeError}
                      aria-describedby={shouldShowPriceRangeError ? 'home-max-price-error' : undefined}
                      onChange={(event) => updateSearchFilter('maxPrice', event.target.value)}
                    />
                    <span>Triệu</span>
                  </div>
                  {shouldShowPriceRangeError && (
                    <small id="home-max-price-error" className="site-home-search__error">
                      Giá đến phải lớn hơn giá từ
                    </small>
                  )}
                </div>

                <div className="site-home-search__field">
                  <label htmlFor="home-min-area">Diện tích từ</label>
                  <input
                    id="home-min-area"
                    type="number"
                    min="0"
                    placeholder="m²"
                    value={searchFilters.minArea}
                    onChange={(event) => updateSearchFilter('minArea', event.target.value)}
                  />
                </div>

                <button type="submit" className="site-home-search__submit">
                  <SearchOutlined />
                  Tìm ngay
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="site-home-section">
          <div className="site-home-section-heading">
            <span className="site-home-eyebrow">Danh mục nổi bật</span>
            <h2>Khám phá loại hình cho thuê phù hợp với bạn</h2>
          </div>

          <div className="site-home-categories">
            {homeData.categories.map((category, index) => {
              const categoryCount = getCategoryCount(category, allHomePosts);

              return (
                <Link
                  key={category.id}
                  to={createListingPath({ categorySlug: category.slug })}
                  className="site-home-category"
                >
                  <div className="site-home-category__top">
                    <span className="site-home-category__icon">
                      {categoryIconMap[category.slug] || <HomeOutlined />}
                    </span>
                    {categoryCount > 0 && index < 2 && (
                      <span className="site-home-badge site-home-badge--hot">
                        <FireFilled />
                        Nhiều tin
                      </span>
                    )}
                  </div>
                  <h3>{category.label}</h3>
                  <p>{category.description}</p>
                  <div className="site-home-category__meta">
                    <strong>{categoryCount.toLocaleString('vi-VN')}</strong>
                    <span>tin có sẵn</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="site-home-section site-home-section--soft">
          <div className="site-home-section-heading site-home-section-heading--center">
            <span className="site-home-eyebrow">Khu vực phổ biến</span>
            <h2>Tìm kiếm theo phường tại Đà Nẵng</h2>
          </div>

          <div className="site-home-districts">
            {popularWards.length > 0 ? (
              popularWards.map((ward) => (
                <Link
                  key={ward.id}
                  to={`/posts?ward=${encodeURIComponent(ward.name)}`}
                  className="site-home-district"
                >
                  <div className="site-home-district__top">
                    <EnvironmentOutlined />
                    {ward.badge && (
                      <span className="site-home-badge site-home-badge--soft">
                        {ward.badge}
                      </span>
                    )}
                  </div>
                  <strong>{ward.name}</strong>
                  <div className="site-home-district__meta">
                    <span>{ward.postCount} tin</span>
                    <span>Giá TB {ward.averagePrice}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="site-home-empty">Chưa có dữ liệu phường để hiển thị.</div>
            )}
          </div>
        </section>

        <section className="site-home-section">
          {canManageUserNeed && hasNeed && (
            <div className="site-home-recommendations">
              <div className="site-home-section-heading site-home-section-heading--split">
                <div>
                  <span className="site-home-eyebrow">Gợi ý căn hộ</span>
                  <h2>Danh sách gợi ý theo nhu cầu</h2>
                </div>
                <div className="site-home-recommendation-actions">
                  <button
                    type="button"
                    className="site-home-link"
                    onClick={() => void openDialog()}
                  >
                    <EditOutlined />
                    Sửa nhu cầu
                  </button>
                </div>
              </div>

              {needSummaryChips.length > 0 && (
                <div className="site-home-recommendation-chips" aria-label="Nhu cầu đã lưu">
                  {needSummaryChips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              )}

              <div className="site-home-section-heading site-home-section-heading--split site-home-recommendation-toolbar">
                <p>
                  {recommendedPosts.length > 0
                    ? `Score cao nhất: ${recommendedPosts[0].recommendationScore ?? 0}%`
                    : 'Đang chờ dữ liệu gợi ý'}
                </p>
                <div className="site-home-post-tabs" role="tablist" aria-label="Lọc gợi ý căn hộ">
                  {recommendationTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={recommendationTab === tab.key ? 'is-active' : ''}
                      onClick={() => setRecommendationTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {recommendationLoading ? (
                <div className="site-home-empty">Đang phân tích nhu cầu và tải gợi ý phù hợp...</div>
              ) : recommendationPostsToShow.length > 0 ? (
                <div className="site-home-post-grid">
                  {recommendationPostsToShow.map((post) => renderPostCard(post, true))}
                </div>
              ) : (
                <div className="site-home-empty">
                  Chưa có căn hộ nào match nhu cầu hiện tại. Bạn có thể chỉnh lại giá hoặc khu vực để mở rộng gợi ý.
                </div>
              )}
            </div>
          )}

          <div className="site-home-section-heading site-home-section-heading--split">
            <div>
              <span className="site-home-eyebrow">Gợi ý dành cho bạn</span>
              <h2>Tin nổi bật theo nhu cầu tìm kiếm</h2>
            </div>
            <div className="site-home-post-tabs" role="tablist" aria-label="Lọc tin nổi bật">
              {featuredTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeTab === tab.key ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="site-home-post-grid">
              {featuredPosts.map((post) => renderPostCard(post))}
            </div>
          ) : (
            <div className="site-home-empty">
              Chưa có tin phù hợp để hiển thị. Dữ liệu sẽ tự cập nhật khi có bài đăng đang hoạt động.
            </div>
          )}
        </section>

        <section className="site-home-section site-home-trust">
          <div className="site-home-trust__content">
            <div>
              <span className="site-home-eyebrow">Dữ liệu hệ thống</span>
              <h2>Thông tin hiển thị bám theo dữ liệu đang có</h2>
            </div>
            <button
              type="button"
              className={`site-home-notify-btn ${notifyEnabled ? 'is-active' : ''}`}
              onClick={() => setNotifyEnabled((value) => !value)}
            >
              <BellOutlined />
              {notifyEnabled ? 'Đã bật thông báo' : 'Thông báo cho tôi khi có tin mới'}
            </button>
          </div>

          <div className="site-home-trust__stats">
            {stats.map((item) => (
              <div key={item.label} className="site-home-trust-stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="site-home-data-cards">
            {dataSourceCards.map((item) => (
              <article key={item.title} className="site-home-data-card">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-home-section site-home-deals">
          <div className="site-home-section-heading site-home-section-heading--split">
            <div>
              <span className="site-home-eyebrow">Tin giá tốt</span>
              <h2>Các lựa chọn giá thấp đang có</h2>
            </div>
            <Link to={createListingPath({ categorySlug: 'phong-tro' })} className="site-home-link">
              Xem tất cả
            </Link>
          </div>

          {dealPosts.length > 0 ? (
            <div className="site-home-deal-list">
              {dealPosts.map((post, index) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="site-home-deal">
                  <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
                  <div>
                    <span>
                      <ThunderboltFilled />
                      Giá tốt #{index + 1}
                    </span>
                    <h3>{post.title}</h3>
                    <p>{post.priceText} • {post.areaText}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="site-home-empty">Chưa có dữ liệu tin giá tốt để hiển thị.</div>
          )}
        </section>

        <section className="site-home-section site-home-latest">
          <div className="site-home-section-heading site-home-section-heading--split">
            <div>
              <span className="site-home-eyebrow">Tin mới đăng</span>
              <h2>Cập nhật gần đây</h2>
            </div>
            <Link to={createListingPath({ categorySlug: 'phong-tro' })} className="site-home-link">
              Xem thêm
            </Link>
          </div>

          {newestPosts.length > 0 ? (
            <div className="site-home-latest__list">
              {newestPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="site-home-latest__item">
                  <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
                  <div>
                    <h3>{post.title}</h3>
                    <p>{post.priceText}</p>
                  </div>
                  <span>{post.postedAtText}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="site-home-empty">Chưa có tin mới từ dữ liệu bài đăng.</div>
          )}
        </section>

        <section className="site-home-support">
          <MessageOutlined />
          <div>
            <strong>Hỗ trợ tìm phòng nhanh</strong>
            <span>Chat box luôn sẵn sàng ở góc màn hình để hỗ trợ lọc tin phù hợp.</span>
          </div>
        </section>
      </main>

      <UserNeedDialog
        open={open}
        mode={hasNeed ? 'edit' : 'create'}
        loading={loading}
        initialValues={initialValues}
        onClose={close}
        onSubmit={submit}
      />
    </>
  );
};

export default Home;
