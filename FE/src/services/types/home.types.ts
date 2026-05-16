export interface IHomeCategory {
  id: string | number;
  key: string;
  label: string;
  slug: string;
  description: string;
}

export interface IHomeDistrict {
  id: string;
  name: string;
  postCount: number;
}

export interface IHomeStat {
  label: string;
  value: string;
}

export interface IHomePostCard {
  id: string | number;
  title: string;
  slug: string;
  priceText: string;
  areaText: string;
  addressText: string;
  wardText: string;
  categoryLabel: string;
  categorySlug?: string;
  description: string;
  coverImage: string;
  gallery: string[];
  postedBy: string;
  postedAtText: string;
  phone: string;
  tags: string[];
  amenities: string[];
  price?: number | null;
  area?: number | null;
  districtId?: string;
  createdAtTime?: number;
  likeCount?: number;
  hasVideo?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface IHomePageData {
  heroTitle: string;
  heroSubtitle: string;
  stats: IHomeStat[];
  categories: IHomeCategory[];
  districts: IHomeDistrict[];
  allPosts: IHomePostCard[];
  featuredPosts: IHomePostCard[];
  newestPosts: IHomePostCard[];
  priceRanges: string[];
  areaRanges: string[];
}
