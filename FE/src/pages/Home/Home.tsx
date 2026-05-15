import './Home.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartFilled } from '@ant-design/icons';

import {
  createDefaultHomePageData,
  createListingPath,
  getHomePageData,
} from '../../services/api/HomeService';
import type { IHomePageData } from '../../services/types/home.types';

import { useUserNeedDialog } from '../../hooks/useUserNeedDialog';
import UserNeedDialog from '../../components/common/UserNeedDialog/UserNeedDialog';

import {
  getRecommendedPosts,
  getApartmentDetailByPost,
  getPostImages,
} from '../../services/api/PostManagementService';

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
    .filter((district) => district.id !== 'all')
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
            {homeData.categories.map((category, index) => (
              <Link
                key={category.id}
                to={createListingPath({ categorySlug: category.slug })}
                className="site-home-category"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
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
                to={createListingPath({ districtId: district.id })}
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
              <span className="site-home-eyebrow">
                {recommendedPosts.length ? 'AI Recommendation' : 'Gợi ý dành cho bạn'}
              </span>

              <h2>
                {recommendedPosts.length
                  ? 'Căn hộ đề xuất theo nhu cầu của bạn'
                  : 'Tin nổi bật theo nhu cầu tìm kiếm'}
              </h2>
            </div>

            <Link
              to={createListingPath({ categorySlug: 'phong-tro' })}
              className="site-home-link"
            >
              Xem tất cả
            </Link>
          </div>

          {recommendLoading ? (
            <div className="site-home-loading">
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
        </section>

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
        </section>
      </main>

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