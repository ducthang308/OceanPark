import fallbackRoomImage from '../../assets/img/co4la.png';
import {
  getApartmentDetailByPost,
  getCategories,
  getFavoriteCountByPost,
  getPostImages,
  getPosts,
} from './PostManagementService';
import type {
  BaiDangDTO,
  ChiTietCanHoDTO,
  DanhMucDTO,
  HinhAnhBaiDangDTO,
} from './PostManagementService';
import type {
  IHomeCategory,
  IHomeDistrict,
  IHomePageData,
  IHomePostCard,
  IHomeStat,
} from '../types/home.types';

export interface RangeFilterOption {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

interface ListingPathOptions {
  categorySlug?: string;
  districtId?: string;
  priceRangeId?: string;
  areaRangeId?: string;
}

interface ListingData {
  categories: IHomeCategory[];
  districts: IHomeDistrict[];
  posts: IHomePostCard[];
  stats: IHomeStat[];
}

const HIDDEN_POST_STATUSES = new Set(['HIDDEN', 'PENDING', 'CHO_DUYET', 'TU_CHOI', 'DELETED']);

export const HOME_STATIC_CONTENT = {
  heroTitle: 'Nền tảng cho thuê nhà, phòng trọ và căn hộ đáng tin cậy tại Đà Nẵng',
  heroSubtitle:
    'Khám phá không gian phù hợp với ngân sách và nhu cầu của bạn, từ phòng trọ tối ưu chi phí đến căn hộ cao cấp đầy đủ tiện nghi.',
};

export const HOME_DEFAULT_STATS: IHomeStat[] = [
  { label: 'Tin đang hiển thị', value: '73.513+' },
  { label: 'Chủ nhà đang hoạt động', value: '8.200+' },
  { label: 'Khu vực được phủ', value: '56+' },
];

export const DEFAULT_HOME_CATEGORIES: IHomeCategory[] = [
  {
    id: 'DM1',
    key: 'DM1',
    label: 'Phòng trọ',
    slug: 'phong-tro',
    description: 'Khám phá phòng trọ phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM2',
    key: 'DM2',
    label: 'Căn hộ cao cấp',
    slug: 'can-ho-cao-cap',
    description: 'Khám phá căn hộ cao cấp phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM3',
    key: 'DM3',
    label: 'Căn hộ chung cư',
    slug: 'can-ho-chung-cu',
    description: 'Khám phá căn hộ chung cư phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM4',
    key: 'DM4',
    label: 'Nhà nguyên căn',
    slug: 'nha-nguyen-can',
    description: 'Khám phá nhà nguyên căn phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM5',
    key: 'DM5',
    label: 'Căn hộ ở ghép',
    slug: 'can-ho-o-ghep',
    description: 'Khám phá căn hộ ở ghép phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM6',
    key: 'DM6',
    label: 'Căn hộ mini',
    slug: 'can-ho-mini',
    description: 'Khám phá căn hộ mini phù hợp nhu cầu của bạn',
  },
  {
    id: 'DM7',
    key: 'DM7',
    label: 'Mặt bằng cho thuê',
    slug: 'mat-bang-cho-thue',
    description: 'Khám phá mặt bằng cho thuê phù hợp nhu cầu của bạn',
  },
];

export const DISTRICT_OPTIONS: IHomeDistrict[] = [
  { id: 'all', name: 'Tất cả', postCount: 0 },
  { id: 'hai-chau', name: 'Hải Châu', postCount: 0 },
  { id: 'son-tra', name: 'Sơn Trà', postCount: 0 },
  { id: 'ngu-hanh-son', name: 'Ngũ Hành Sơn', postCount: 0 },
  { id: 'thanh-khe', name: 'Thanh Khê', postCount: 0 },
  { id: 'lien-chieu', name: 'Liên Chiểu', postCount: 0 },
  { id: 'cam-le', name: 'Cẩm Lệ', postCount: 0 },
  { id: 'hoa-vang', name: 'Hòa Vang', postCount: 0 },
];

export const PRICE_RANGE_OPTIONS: RangeFilterOption[] = [
  { id: 'tat-ca', label: 'Tất cả', min: 0, max: Infinity },
  { id: 'duoi-3-trieu', label: 'Dưới 3 triệu', max: 3_000_000 },
  { id: '3-5-trieu', label: 'Từ 3 - 5 triệu', min: 3_000_000, max: 5_000_000 },
  { id: '5-7-trieu', label: 'Từ 5 - 7 triệu', min: 5_000_000, max: 7_000_000 },
  { id: '7-10-trieu', label: 'Từ 7 - 10 triệu', min: 7_000_000, max: 10_000_000 },
  { id: '10-15-trieu', label: 'Từ 10 - 15 triệu', min: 10_000_000, max: 15_000_000 },
  { id: 'tren-15-trieu', label: 'Trên 15 triệu', min: 15_000_000 },
];

export const AREA_RANGE_OPTIONS: RangeFilterOption[] = [
  { id: 'tat-ca', label: 'Tất cả', min: 0, max: Infinity },
  { id: 'duoi-20m2', label: 'Dưới 20 m²', max: 20 },
  { id: '20-30m2', label: 'Từ 20 - 30 m²', min: 20, max: 30 },
  { id: '30-50m2', label: 'Từ 30 - 50 m²', min: 30, max: 50 },
  { id: '50-70m2', label: 'Từ 50 - 70 m²', min: 50, max: 70 },
  { id: '70-90m2', label: 'Từ 70 - 90 m²', min: 70, max: 90 },
  { id: 'tren-90m2', label: 'Trên 90 m²', min: 90 },
];

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'))
    .toLowerCase();

export const slugify = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'danh-muc';

const WARD_TO_DISTRICT = new Map(
  [
    ['Hải Châu 1', 'hai-chau'],
    ['Hải Châu 2', 'hai-chau'],
    ['Thạch Thang', 'hai-chau'],
    ['Thanh Bình', 'hai-chau'],
    ['Thuận Phước', 'hai-chau'],
    ['Hòa Thuận Đông', 'hai-chau'],
    ['Hòa Thuận Tây', 'hai-chau'],
    ['Bình Hiên', 'hai-chau'],
    ['Bình Thuận', 'hai-chau'],
    ['Nam Dương', 'hai-chau'],
    ['Phước Ninh', 'hai-chau'],
    ['Hòa Cường Bắc', 'hai-chau'],
    ['Hòa Cường Nam', 'hai-chau'],
    ['An Hải Bắc', 'son-tra'],
    ['An Hải Tây', 'son-tra'],
    ['An Hải Đông', 'son-tra'],
    ['Mân Thái', 'son-tra'],
    ['Nại Hiên Đông', 'son-tra'],
    ['Phước Mỹ', 'son-tra'],
    ['Thọ Quang', 'son-tra'],
    ['Mỹ An', 'ngu-hanh-son'],
    ['Khuê Mỹ', 'ngu-hanh-son'],
    ['Hòa Hải', 'ngu-hanh-son'],
    ['Hòa Quý', 'ngu-hanh-son'],
    ['Tam Thuận', 'thanh-khe'],
    ['Thanh Khê Đông', 'thanh-khe'],
    ['Thanh Khê Tây', 'thanh-khe'],
    ['Xuân Hà', 'thanh-khe'],
    ['Tân Chính', 'thanh-khe'],
    ['Chính Gián', 'thanh-khe'],
    ['Vĩnh Trung', 'thanh-khe'],
    ['Thạc Gián', 'thanh-khe'],
    ['An Khê', 'thanh-khe'],
    ['Hòa Khê', 'thanh-khe'],
    ['Hòa Minh', 'lien-chieu'],
    ['Hòa Khánh Bắc', 'lien-chieu'],
    ['Hòa Khánh Nam', 'lien-chieu'],
    ['Hòa Hiệp Bắc', 'lien-chieu'],
    ['Hòa Hiệp Nam', 'lien-chieu'],
    ['Khuê Trung', 'cam-le'],
    ['Hòa An', 'cam-le'],
    ['Hòa Phát', 'cam-le'],
    ['Hòa Thọ Đông', 'cam-le'],
    ['Hòa Thọ Tây', 'cam-le'],
    ['Hòa Xuân', 'cam-le'],
    ['Hòa Phong', 'hoa-vang'],
    ['Hòa Phú', 'hoa-vang'],
    ['Hòa Châu', 'hoa-vang'],
    ['Hòa Tiến', 'hoa-vang'],
    ['Hòa Phước', 'hoa-vang'],
    ['Hòa Nhơn', 'hoa-vang'],
    ['Hòa Sơn', 'hoa-vang'],
    ['Hòa Liên', 'hoa-vang'],
    ['Hòa Bắc', 'hoa-vang'],
    ['Hòa Khương', 'hoa-vang'],
    ['Hòa Ninh', 'hoa-vang'],
  ].map(([ward, districtId]) => [normalizeText(ward), districtId]),
);

const getImageUrl = (image: HinhAnhBaiDangDTO) =>
  image.thumbnailUrl?.trim() || image.duongDan?.trim() || '';

const hasVideoAsset = (images: HinhAnhBaiDangDTO[]) =>
  images.some((image) => {
    const type = (image.loai || '').toUpperCase();
    const path = `${image.duongDan || ''} ${image.thumbnailUrl || ''}`.toLowerCase();

    return type.includes('VIDEO') || /\.(mp4|mov|webm|avi)(\?|$)/i.test(path);
  });

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

const isPublicPost = (post: BaiDangDTO) => {
  const status = post.trangThai?.trim().toUpperCase();
  return !status || !HIDDEN_POST_STATUSES.has(status);
};

const mapCategoryDto = (category: DanhMucDTO): IHomeCategory => {
  const label = category.tenDanhMuc || category.maDanhMuc || 'Danh mục';

  return {
    id: category.maDanhMuc,
    key: category.maDanhMuc,
    label,
    slug: slugify(label),
    description: `Khám phá ${label.toLowerCase()} phù hợp nhu cầu của bạn`,
  };
};

const createCategoryLookup = (categories: IHomeCategory[]) => {
  const lookup = new Map<string, IHomeCategory>();

  [...DEFAULT_HOME_CATEGORIES, ...categories].forEach((category, index) => {
    lookup.set(String(category.id), category);
    lookup.set(category.key, category);
    lookup.set(category.slug, category);
    lookup.set(String(index + 1), category);
    lookup.set(`DM${index + 1}`, category);
  });

  return lookup;
};

export const resolveDistrictId = (addressText: string, wardText = '') => {
  const normalizedAddress = normalizeText(`${addressText} ${wardText}`);
  const district = DISTRICT_OPTIONS.find((item) => {
    if (item.id === 'all') return false;

    const districtName = normalizeText(item.name);
    const districtKey = normalizeText(item.id.replace(/-/g, ' '));

    return normalizedAddress.includes(districtName) || normalizedAddress.includes(districtKey);
  });

  if (district) return district.id;

  for (const [ward, districtId] of WARD_TO_DISTRICT.entries()) {
    if (normalizedAddress.includes(ward)) return districtId;
  }

  return undefined;
};

const buildPostCard = (
  post: BaiDangDTO,
  detail: ChiTietCanHoDTO | null,
  images: HinhAnhBaiDangDTO[],
  categoryLookup: Map<string, IHomeCategory>,
  index: number,
): IHomePostCard | null => {
  const postId = post.maBaiDang?.trim();
  if (!postId) return null;

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
    id: postId,
    title: post.tieuDe?.trim() || 'Bài đăng chưa có tiêu đề',
    slug: postId,
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
    tags: [],
    amenities: [],
    price,
    area,
    districtId: resolveDistrictId(addressText, wardText),
    createdAtTime: getDateTime(post.ngayDang) || index,
    likeCount: 0,
    hasVideo: hasVideoAsset(images),
    isFeatured: false,
    isNew: false,
  };
};

const buildDistricts = (posts: IHomePostCard[]): IHomeDistrict[] =>
  DISTRICT_OPTIONS.map((district) => {
    if (district.id === 'all') {
      return { ...district, postCount: posts.length };
    }

    return {
      ...district,
      postCount: posts.filter((post) => post.districtId === district.id).length,
    };
  });

const buildStats = (posts: IHomePostCard[], districts: IHomeDistrict[], sourcePosts: BaiDangDTO[]) => {
  const ownerCount = new Set(sourcePosts.map((post) => post.maNguoiDung).filter(Boolean)).size;
  const coveredDistrictCount = districts.filter(
    (district) => district.id !== 'all' && district.postCount > 0,
  ).length;

  return [
    { label: 'Tin đang hiển thị', value: String(posts.length) },
    { label: 'Chủ nhà đang hoạt động', value: String(ownerCount) },
    { label: 'Khu vực được phủ', value: String(coveredDistrictCount) },
  ];
};

export const getRentalListingData = async (): Promise<ListingData> => {
  const [postsResponse, categoriesResponse] = await Promise.all([
    getPosts(),
    getCategories().catch(() => [] as DanhMucDTO[]),
  ]);

  const apiCategories = categoriesResponse.map(mapCategoryDto);
  const categories = apiCategories.length > 0 ? apiCategories : DEFAULT_HOME_CATEGORIES;
  const categoryLookup = createCategoryLookup(categories);

  const mappedPosts: Array<IHomePostCard | null> = await Promise.all(
    postsResponse.filter(isPublicPost).map(async (post, index) => {
      const postId = post.maBaiDang?.trim();
      const [detail, images, likeCount] = postId
        ? await Promise.all([
            getApartmentDetailByPost(postId).catch(() => null),
            getPostImages(postId).catch(() => [] as HinhAnhBaiDangDTO[]),
            getFavoriteCountByPost(postId).catch(() => 0),
          ])
        : [null, [] as HinhAnhBaiDangDTO[], 0];

      const postCard = buildPostCard(post, detail, images, categoryLookup, index);

      return postCard
        ? {
            ...postCard,
            likeCount,
          }
        : null;
    }),
  );

  const posts = mappedPosts
    .filter((post): post is IHomePostCard => Boolean(post))
    .sort((a, b) => (b.createdAtTime ?? 0) - (a.createdAtTime ?? 0))
    .map((post, index) => ({
      ...post,
      isFeatured: index < 3,
      isNew: index < 5,
    }));
  const districts = buildDistricts(posts);

  return {
    categories,
    districts,
    posts,
    stats: buildStats(posts, districts, postsResponse.filter(isPublicPost)),
  };
};

export const createDefaultHomePageData = (): IHomePageData => ({
  heroTitle: HOME_STATIC_CONTENT.heroTitle,
  heroSubtitle: HOME_STATIC_CONTENT.heroSubtitle,
  stats: HOME_DEFAULT_STATS,
  categories: DEFAULT_HOME_CATEGORIES,
  districts: DISTRICT_OPTIONS,
  featuredPosts: [],
  newestPosts: [],
  priceRanges: PRICE_RANGE_OPTIONS.map((item) => item.label),
  areaRanges: AREA_RANGE_OPTIONS.map((item) => item.label),
});

export const getHomePageData = async (): Promise<IHomePageData> => {
  const data = await getRentalListingData();

  return {
    heroTitle: HOME_STATIC_CONTENT.heroTitle,
    heroSubtitle: HOME_STATIC_CONTENT.heroSubtitle,
    stats: data.stats,
    categories: data.categories,
    districts: data.districts,
    featuredPosts: data.posts.filter((post) => post.isFeatured).slice(0, 3),
    newestPosts: data.posts.slice(0, 5),
    priceRanges: PRICE_RANGE_OPTIONS.map((item) => item.label),
    areaRanges: AREA_RANGE_OPTIONS.map((item) => item.label),
  };
};

export const findRangeOption = (options: RangeFilterOption[], id: string | null) => {
  if (!id) return undefined;
  return options.find((item) => item.id === id);
};

export const isNumberInRange = (value: number | null | undefined, range?: RangeFilterOption) => {
  if (!range) return true;
  if (typeof value !== 'number' || Number.isNaN(value)) return false;

  const aboveMin = typeof range.min !== 'number' || value >= range.min;
  const belowMax = typeof range.max !== 'number' || value < range.max;

  return aboveMin && belowMax;
};

export const createListingPath = ({
  categorySlug,
  districtId,
  priceRangeId,
  areaRangeId,
}: ListingPathOptions) => {
  const path = categorySlug ? `/danh-muc/${categorySlug}` : '/posts';
  const params = new URLSearchParams();

  if (districtId && districtId !== 'all') params.set('district', districtId);
  if (priceRangeId) params.set('price', priceRangeId);
  if (areaRangeId) params.set('area', areaRangeId);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
};
