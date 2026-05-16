import type { IHomePageData, IHomePostCard } from '../types/home.types';
import { postsMock } from './posts.mock';
import { usersMock } from './users.mock';
import { categoriesMock } from './categories.mock';
import { apartmentDetailsMock } from './apartment-details.mock';
import { postImagesMock } from './post-images.mock';
import { tagsMock } from './tags.mock';
import { amenitiesMock } from './amenities.mock';
import { postTagsMock } from './post-tags.mock';
import { postAmenitiesMock } from './post-amenities.mock';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value)}đ/tháng`;

const mapPostToHomeCard = (postId: number): IHomePostCard | null => {
  const post = postsMock.find((item) => item.id === postId);
  if (!post) return null;

  const detail = apartmentDetailsMock.find((item) => item.idBaiDang === post.id);
  const owner = usersMock.find((item) => item.id === post.idNguoiDung);
  const category = categoriesMock.find((item) => item.id === post.idDanhMuc);
  const images = postImagesMock
    .filter((item) => item.idBaiDang === post.id)
    .sort((a, b) => a.thuTu - b.thuTu)
    .map((item) => item.duongDan);

  const tags = postTagsMock
    .filter((item) => item.idBaiDang === post.id)
    .map((item) => tagsMock.find((tag) => tag.id === item.idThe)?.tenThe)
    .filter(Boolean) as string[];

  const amenities = postAmenitiesMock
    .filter((item) => item.idBaiDang === post.id)
    .map((item) => amenitiesMock.find((amenity) => amenity.id === item.idTienIch)?.tenTienIch)
    .filter(Boolean) as string[];

  return {
    id: post.id,
    title: post.tieuDe,
    slug: `post-${post.id}`,
    priceText: formatCurrency(detail?.gia || 0),
    areaText: `${detail?.dienTich || 0} m²`,
    addressText: detail?.diaChiCuThe || '',
    wardText: detail?.phuong || '',
    categoryLabel: category?.tenDanhMuc || '',
    categorySlug: category?.slug || '',
    description: post.noiDung,
    coverImage: images[0] || '',
    gallery: images,
    postedBy: owner?.hoVaTen || 'Chủ nhà',
    postedAtText: post.ngayDang,
    phone: post.lienHe,
    tags,
    amenities,
    price: detail?.gia ?? null,
    area: detail?.dienTich ?? null,
    likeCount: 0,
    isFeatured: [101, 102, 105].includes(post.id),
    isNew: [104, 101, 102, 103].includes(post.id),
    hasVideo: [102, 104].includes(post.id),
  };
};

const allHomeMockPosts = postsMock
  .map((post) => mapPostToHomeCard(post.id))
  .filter(Boolean) as IHomePostCard[];
const mockOwnerCount = new Set(postsMock.map((post) => post.idNguoiDung).filter(Boolean)).size;

export const homeMockData: IHomePageData = {
  heroTitle: 'Nền tảng cho thuê nhà, phòng trọ và căn hộ đáng tin cậy tại Đà Nẵng',
  heroSubtitle:
    'Khám phá không gian phù hợp với ngân sách và nhu cầu của bạn, từ phòng trọ tối ưu chi phí đến căn hộ cao cấp đầy đủ tiện nghi.',
  stats: [
    { label: 'Tin đang hiển thị', value: String(allHomeMockPosts.length) },
    { label: 'Chủ nhà đang hoạt động', value: String(mockOwnerCount) },
    { label: 'Khu vực được phủ', value: '0' },
  ],
  categories: categoriesMock.map((item) => ({
    id: item.id,
    key: String(item.id),
    label: item.tenDanhMuc,
    slug: item.slug,
    description: `Khám phá ${item.tenDanhMuc.toLowerCase()} phù hợp nhu cầu của bạn`,
  })),
  districts: [
    { id: 'all', name: 'Tất cả', postCount: 2450 },
    { id: 'hai-chau', name: 'Hải Châu', postCount: 640 },
    { id: 'son-tra', name: 'Sơn Trà', postCount: 530 },
    { id: 'ngu-hanh-son', name: 'Ngũ Hành Sơn', postCount: 420 },
    { id: 'thanh-khe', name: 'Thanh Khê', postCount: 395 },
    { id: 'lien-chieu', name: 'Liên Chiểu', postCount: 318 },
    { id: 'cam-le', name: 'Cẩm Lệ', postCount: 286 },
    { id: 'hoa-vang', name: 'Hòa Vang', postCount: 124 },
  ],
  allPosts: allHomeMockPosts,
  featuredPosts: [101, 102, 105]
    .map(mapPostToHomeCard)
    .filter(Boolean) as IHomePostCard[],
  newestPosts: [104, 101, 102, 103, 105]
    .map(mapPostToHomeCard)
    .filter(Boolean) as IHomePostCard[],
  priceRanges: [
    'Dưới 3 triệu',
    'Từ 3 - 5 triệu',
    'Từ 5 - 7 triệu',
    'Từ 7 - 10 triệu',
    'Từ 10 - 15 triệu',
    'Trên 15 triệu',
  ],
  areaRanges: [
    'Dưới 20 m²',
    'Từ 20 - 30 m²',
    'Từ 30 - 50 m²',
    'Từ 50 - 70 m²',
    'Từ 70 - 90 m²',
    'Trên 90 m²',
  ],
};
