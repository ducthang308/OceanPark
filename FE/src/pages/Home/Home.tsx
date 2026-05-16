import './Home.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BankOutlined,
  BellOutlined,
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
} from '../../services/api/HomeService';
import type { IHomeCategory, IHomeDistrict, IHomePageData, IHomePostCard } from '../../services/types/home.types';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

import {
  getRecommendedPosts,
  getApartmentDetailByPost,
  getPostImages,
} from '../../services/api/PostManagementService';
type FeaturedTab = 'featured' | 'newest' | 'budget' | 'large';

interface SearchFilters {
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
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

const getUniquePosts = (posts: IHomePostCard[]) =>
  posts.filter((post, index, arr) => arr.findIndex((item) => String(item.id) === String(post.id)) === index);

const getCategoryCount = (category: IHomeCategory, posts: IHomePostCard[]) =>
  posts.filter((post) => post.categorySlug === category.slug).length;

const getDistrictMeta = (district: IHomeDistrict, posts: IHomePostCard[], index: number) => {
  const districtPosts = posts.filter((post) => post.districtId === district.id);
  const prices = districtPosts
    .map((post) => post.price)
    .filter((price): price is number => typeof price === 'number' && price > 0);
  const averagePrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
  const hasNewPost = districtPosts.some((post) => post.isNew);

  return {
    averagePrice: formatCompactCurrency(averagePrice),
    badge: district.postCount > 0 && index === 0 ? 'Nhiều tin' : hasNewPost ? 'Có tin mới' : '',
  };
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
  const [homeData, setHomeData] = useState<IHomePageData>(() => createDefaultHomePageData());
  const [homeLoading, setHomeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeaturedTab>('featured');
  const [savedPostIds, setSavedPostIds] = useState<Array<string | number>>([]);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    categorySlug: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
  });
  const maNguoiDung = localStorage.getItem('userId');

  const DEFAULT_IMAGE =
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop';

  const Home: React.FC = () => {
    const [homeData, setHomeData] = useState<IHomePageData>(() =>
      createDefaultHomePageData(),
    );
    const [homeLoading, setHomeLoading] = useState(true);
    const [recommendedPosts, setRecommendedPosts] = useState<any[]>([]);
    const [recommendLoading, setRecommendLoading] = useState(false);

    const maNguoiDung =
      localStorage.getItem('maNguoiDung') || localStorage.getItem('userId');

    const { open, close, loading, initialValues, submit } =
      useUserNeedDialog(maNguoiDung);

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

<<<<<<< HEAD
    useEffect(() => {
      let ignore = false;

      const loadRecommend = async () => {
        try {
          if (!maNguoiDung) return;

          setRecommendLoading(true);

          const data = await getRecommendedPosts(maNguoiDung);

          const mapped = await Promise.all(
            data.map(async (item: any) => {
              let detail: any = null;
              let images: any[] = [];

              try {
                detail = await getApartmentDetailByPost(item.maBaiDang);
              } catch {
                detail = null;
              }

              try {
                images = await getPostImages(item.maBaiDang);
              } catch {
                images = [];
              }

              return {
                id: item.maBaiDang,
                title: item.tieuDe,
                addressText:
                  detail?.diaChiCuThe || detail?.phuong || 'Đà Nẵng',
                priceText: detail?.gia
                  ? `${Number(detail.gia).toLocaleString('vi-VN')}đ/tháng`
                  : 'Liên hệ',
                areaText: detail?.dienTich
                  ? `${detail.dienTich} m²`
                  : 'Căn hộ phù hợp',
                categoryLabel: 'AI Recommendation',
                coverImage:
                  images?.[0]?.duongDan ||
                  images?.[0]?.thumbnailUrl ||
                  DEFAULT_IMAGE,
                likeCount: 0,
              };
            }),
          );

          if (!ignore) setRecommendedPosts(mapped);
        } catch (error) {
          console.error('Lỗi load recommend:', error);
        } finally {
          if (!ignore) setRecommendLoading(false);
        }
      };

      loadRecommend();

      return () => {
        ignore = true;
      };
    }, [maNguoiDung]);

    const featuredPosts = homeData.featuredPosts.slice(0, 3);
    const newestPosts = homeData.newestPosts.slice(0, 3);
    const recommendSource = recommendedPosts.length ? recommendedPosts : featuredPosts;

    const popularDistricts = homeData.districts
=======
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
  const popularDistricts = [...homeData.districts]
>>>>>>> origin/QuangHuyver2
      .filter((district) => district.id !== 'all')
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 6);

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

    const updateSearchFilter = (key: keyof SearchFilters, value: string) => {
      setSearchFilters((current) => ({
        ...current,
        [key]: value,
      }));
    };

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const path = searchFilters.categorySlug
        ? `/danh-muc/${searchFilters.categorySlug}`
        : '/posts';
      const params = new URLSearchParams();
      const minPrice = Number(searchFilters.minPrice);
      const maxPrice = Number(searchFilters.maxPrice);
      const minArea = Number(searchFilters.minArea);

      if (Number.isFinite(minPrice) && minPrice > 0) params.set('minPrice', String(minPrice * 1_000_000));
      if (Number.isFinite(maxPrice) && maxPrice > 0) params.set('maxPrice', String(maxPrice * 1_000_000));
      if (Number.isFinite(minArea) && minArea > 0) params.set('minArea', String(minArea));

      const query = params.toString();
      navigate(query ? `${path}?${query}` : path);
    };

    const toggleSavedPost = (postId: string | number) => {
      setSavedPostIds((current) =>
        current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
      );
    };

    return (
      <>
        <main className="site-home-page">
          <section className="site-home-hero">
            <div className="site-home-hero__overlay" />

            <div className="site-home-hero__container">
              <div className="site-home-hero__content">
                <p className="site-home-eyebrow">
                  Nền tảng cho thuê nổi bật tại Đà Nẵng
                </p>
                <h1>{homeData.heroTitle}</h1>
                <p className="site-home-hero__description">
                  {homeData.heroSubtitle}
                </p>

                <div className="site-home-hero__actions">
                  <Link
                    to="/danh-muc/phong-tro"
                    className="site-home-btn site-home-btn--primary"
                  >
                    Khám phá tin thuê
                  </Link>

                  <Link
                    to="/service-price"
                    className="site-home-btn site-home-btn--ghost"
                  >
                    Xem bảng giá
                  </Link>
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
                    <input
                      id="home-min-price"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="triệu"
                      value={searchFilters.minPrice}
                      onChange={(event) => updateSearchFilter('minPrice', event.target.value)}
                    />
                  </div>

                  <div className="site-home-search__field">
                    <label htmlFor="home-max-price">Giá đến</label>
                    <input
                      id="home-max-price"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="triệu"
                      value={searchFilters.maxPrice}
                      onChange={(event) => updateSearchFilter('maxPrice', event.target.value)}
                    />
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

          <section className="site-home-stats">
            <div className="site-home-stats__inner">
              {stats.map((item) => (
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
              <h2>Tìm kiếm theo quận tại Đà Nẵng</h2>
            </div>

            <div className="site-home-districts">
              {popularDistricts.map((district, index) => {
                const districtMeta = getDistrictMeta(district, allHomePosts, index);

                return (
                  <Link
                    key={district.id}
                    to={createListingPath({ districtId: district.id })}
                    className="site-home-district"
                  >
                    <div className="site-home-district__top">
                      <EnvironmentOutlined />
                      {districtMeta.badge && (
                        <span className="site-home-badge site-home-badge--soft">
                          {districtMeta.badge}
                        </span>
                      )}
                    </div>
                    <strong>{district.name}</strong>
                    <div className="site-home-district__meta">
                      <span>{district.postCount} tin</span>
                      <span>Giá TB {districtMeta.averagePrice}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="site-home-section">
            <div className="site-home-section-heading site-home-section-heading--split">
              <div>
                <span className="site-home-eyebrow">
                  {recommendedPosts.length ? 'AI Recommendation' : 'Gợi ý dành cho bạn'}
                </span>

                <h2>
                  {recommendedPosts.length
                    ? 'Căn hộ đề xuất theo nhu cầu của bạn'
                    : 'Tin nổi bật theo nhu cầu tìm kiếm'}
                </h2>
              </div>
<<<<<<< HEAD

    <Link
      to={createListingPath({ categorySlug: 'phong-tro' })}
      className="site-home-link"
    >
      Xem tất cả
    </Link>
          </div >

{
  recommendLoading?(
            <div className = "site-home-loading" >
      Đang tải căn hộ đề xuất...
            </div>
          ) : (
  <div className="site-home-post-grid">
    {recommendSource.map((post) => (
      <Link
        key={post.id}
        to={`/posts/${post.id}`}
        className="site-home-post"
      >
        <div className="site-home-post__image-wrap">
          <img src={post.coverImage || DEFAULT_IMAGE} alt={post.title} />

          <span className="site-home-post__favorite-count">
            <HeartFilled />
            {post.likeCount ?? 0}
          </span>
        </div>

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
)}
        </section >

  <section className="site-home-section site-home-latest">
    <div className="site-home-section-heading site-home-section-heading--split">
      <div>
        <span className="site-home-eyebrow">Tin mới đăng</span>
        <h2>Cập nhật gần đây</h2>
      </div>

      <Link
        to={createListingPath({ categorySlug: 'phong-tro' })}
        className="site-home-link"
      >
        Xem thêm
      </Link>
    </div>

    <div className="site-home-post-grid">
      {newestPosts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="site-home-post"
              >
                <div className="site-home-post__image-wrap">
                  <img src={post.coverImage || DEFAULT_IMAGE} alt={post.title} />

=======
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
              {featuredPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="site-home-post">
                  <div className="site-home-post__image-wrap">
                    <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
>>>>>>> origin/QuangHuyver2
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
                    <div className="site-home-post__signals">
                      <small>{post.postedAtText}</small>
                      <small>{post.likeCount ?? 0} lượt lưu</small>
                      {post.hasVideo && <small>Có video</small>}
                    </div>
                  </div>
                </Link>
              ))}
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
<<<<<<< HEAD
=======

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
>>>>>>> origin/QuangHuyver2
      </main >

  <UserNeedDialog
    open={open}
    onClose={close}
    loading={loading}
    initialValues={initialValues}
    onSubmit={submit}
  />
    </>
  );
};

export default Home;