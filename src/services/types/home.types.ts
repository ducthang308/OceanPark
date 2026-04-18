export interface IHomeCategory {
  id: number;
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
  id: number;
  title: string;
  slug: string;
  priceText: string;
  areaText: string;
  addressText: string;
  wardText: string;
  categoryLabel: string;
  description: string;
  coverImage: string;
  gallery: string[];
  postedBy: string;
  postedAtText: string;
  phone: string;
  tags: string[];
  amenities: string[];
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
  featuredPosts: IHomePostCard[];
  newestPosts: IHomePostCard[];
  priceRanges: string[];
  areaRanges: string[];
}