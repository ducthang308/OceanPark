import axiosClient from "./AxiosClient";

export interface BaiDangDTO {
  maBaiDang?: string;
  maNguoiDung?: string;
  maDanhMuc?: string;
  tieuDe?: string;
  noiDung?: string;
  ngayDang?: string;
  trangThai?: string;
  lienHe?: string;
  hinhThucThanhToan?: string;
  luotXem?: number;
}

export interface ChiTietCanHoDTO {
  maChiTietCanHo?: string;
  maBaiDang?: string;
  gia?: number;
  dienTich?: number;
  phongNgu?: number;
  diaChiCuThe?: string;
  huongCanHo?: string;
  phuong?: string;
  lat?: number;
  lng?: number;
  ngayTao?: string;
}

export interface HinhAnhBaiDangDTO {
  maHinhAnhBaiDang?: string;
  maBaiDang?: string;
  loai?: string;
  duongDan?: string;
  thumbnailUrl?: string;
  thuTu?: number;
}

const VIDEO_EXTENSION_REGEX = /\.(mp4|mov|webm|avi|m4v|mkv)(\?|$)/i;

export const getPostMediaUrl = (media: HinhAnhBaiDangDTO) =>
  media.duongDan?.trim() || media.thumbnailUrl?.trim() || "";

export const getPostImageUrl = (media: HinhAnhBaiDangDTO) =>
  media.thumbnailUrl?.trim() || media.duongDan?.trim() || "";

export const isPostVideoAsset = (media: HinhAnhBaiDangDTO) => {
  const type = (media.loai || "").trim().toUpperCase();
  const path = `${media.duongDan || ""} ${media.thumbnailUrl || ""}`.toLowerCase();

  return type.includes("VIDEO") || VIDEO_EXTENSION_REGEX.test(path);
};

export const getPostImageAssets = (media: HinhAnhBaiDangDTO[]) =>
  media.filter((item) => !isPostVideoAsset(item));

export const getPostVideoAssets = (media: HinhAnhBaiDangDTO[]) =>
  media.filter(isPostVideoAsset);

export const getPostImageUrls = (media: HinhAnhBaiDangDTO[]) =>
  getPostImageAssets(media).map(getPostImageUrl).filter(Boolean);

export const getPostVideoUrls = (media: HinhAnhBaiDangDTO[]) =>
  getPostVideoAssets(media).map(getPostMediaUrl).filter(Boolean);

export interface DanhMucDTO {
  maDanhMuc: string;
  tenDanhMuc: string;
}

export interface BaiDangYeuThichDTO {
  maNguoiDung?: string;
  maBaiDang?: string;
  tieuDeBaiDang?: string | null;
  ngayTao?: string | null;
}

export const getCategories = async () => {
  const res = await axiosClient.get<DanhMucDTO[]>("/api/v1/danhmuc");
  return res.data;
};

const mergePostsById = (posts: BaiDangDTO[]) => {
  const result = new Map<string, BaiDangDTO>();

  posts.forEach((post) => {
    if (post.maBaiDang) {
      result.set(post.maBaiDang, post);
    }
  });

  return Array.from(result.values());
};

export const getPosts = async () => {
  const [listResult, detailResult] = await Promise.allSettled([
    axiosClient.get<BaiDangDTO[]>("/api/v1/bai-dang"),
    axiosClient.get<ChiTietCanHoDTO[]>("/api/v1/chi-tiet-can-ho"),
  ]);

  const listPosts = listResult.status === "fulfilled" ? listResult.value.data : [];
  const knownPostIds = new Set(listPosts.map((post) => post.maBaiDang).filter(Boolean));
  const detailPostIds =
    detailResult.status === "fulfilled"
      ? detailResult.value.data
        .map((detail) => detail.maBaiDang)
        .filter((id): id is string => Boolean(id && !knownPostIds.has(id)))
      : [];

  const postResults = await Promise.allSettled(
    Array.from(new Set(detailPostIds)).map((id) =>
      axiosClient.get<BaiDangDTO>(`/api/v1/bai-dang/${id}`)
    )
  );

  const detailPosts = postResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value.data] : []
  );

  if (listResult.status === "rejected" && detailResult.status === "rejected") {
    throw listResult.reason;
  }

  return mergePostsById([...listPosts, ...detailPosts]);
};

export const getPostById = async (maBaiDang: string) => {
  const res = await axiosClient.get<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}`);
  return res.data;
};

export const increasePostView = async (maBaiDang: string) => {
  const res = await axiosClient.put(`/api/v1/bai-dang/${maBaiDang}/view`);
  return res.data;
};

export const createPost = async (payload: BaiDangDTO) => {
  const res = await axiosClient.post<BaiDangDTO>("/api/v1/bai-dang", payload);
  return res.data;
};

export const updatePost = async (maBaiDang: string, payload: BaiDangDTO) => {
  const res = await axiosClient.put<BaiDangDTO>(`/api/v1/bai-dang/${maBaiDang}`, payload);
  return res.data;
};

export const getApartmentDetailByPost = async (maBaiDang: string) => {
  const res = await axiosClient.get<ChiTietCanHoDTO>(`/api/v1/chi-tiet-can-ho/bai-dang/${maBaiDang}`);
  return res.data;
};

export const createApartmentDetail = async (payload: ChiTietCanHoDTO) => {
  const res = await axiosClient.post<ChiTietCanHoDTO>("/api/v1/chi-tiet-can-ho", payload);
  return res.data;
};

export const updateApartmentDetail = async (
  maChiTietCanHo: string,
  payload: ChiTietCanHoDTO
) => {
  const res = await axiosClient.put<ChiTietCanHoDTO>(
    `/api/v1/chi-tiet-can-ho/${maChiTietCanHo}`,
    payload
  );
  return res.data;
};

export const getPostImages = async (maBaiDang: string) => {
  const res = await axiosClient.get<HinhAnhBaiDangDTO[]>(`/api/v1/hinh-anh-bai-dang/bai-dang/${maBaiDang}`);
  return res.data;
};

export const uploadPostImages = async (maBaiDang: string, files: File[]) => {
  const formData = new FormData();
  formData.append("maBaiDang", maBaiDang);
  formData.append("loai", "IMAGE");
  files.forEach((file) => formData.append("files", file));

  const res = await axiosClient.post<HinhAnhBaiDangDTO[]>(
    "/api/v1/hinh-anh-bai-dang/upload-multiple",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
};

export const uploadPostVideo = async (maBaiDang: string, file: File) => {
  const formData = new FormData();
  formData.append("maBaiDang", maBaiDang);
  formData.append("file", file);

  const res = await axiosClient.post<HinhAnhBaiDangDTO>(
    "/api/v1/hinh-anh-bai-dang/upload-video",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
};

export const getFavoritePostsByUser = async (maNguoiDung: string) => {
  const res = await axiosClient.get<BaiDangYeuThichDTO[]>(
    `/api/v1/bai-dang-yeu-thich/nguoi-dung/${maNguoiDung}`
  );
  return res.data;
};

export const getFavoriteUsersByPost = async (maBaiDang: string) => {
  const res = await axiosClient.get<BaiDangYeuThichDTO[]>(
    `/api/v1/bai-dang-yeu-thich/bai-dang/${maBaiDang}`
  );
  return res.data;
};

export const getFavoriteCountByPost = async (maBaiDang: string) => {
  const res = await axiosClient.get<number>(
    `/api/v1/bai-dang-yeu-thich/bai-dang/${maBaiDang}/count`
  );
  return res.data;
};

export const addFavoritePost = async (maNguoiDung: string, maBaiDang: string) => {
  const res = await axiosClient.post<BaiDangYeuThichDTO>("/api/v1/bai-dang-yeu-thich", {
    maNguoiDung,
    maBaiDang,
  });
  return res.data;
};

export const removeFavoritePost = async (maNguoiDung: string, maBaiDang: string) => {
  await axiosClient.delete(
    `/api/v1/bai-dang-yeu-thich/nguoi-dung/${maNguoiDung}/bai-dang/${maBaiDang}`
  );
};

export const isFavoritePostOfUser = async (maNguoiDung: string, maBaiDang: string) => {
  const favorites = await getFavoritePostsByUser(maNguoiDung);
  return favorites.some((favorite) => favorite.maBaiDang === maBaiDang);
};


export interface SepayCreatePaymentRequest {
  maNguoiDung: string;
  loaiHoaDon: 'DANG_BAI' | 'THUE_CAN_HO';
  soTien: number;
  maBaiDang?: string;
  ghiChu?: string;
}

export interface SepayCreatePaymentResponse {
  maHoaDon: string;
  noiDungChuyenKhoan: string;
  soTien: number;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  qrUrl: string;
}

export interface HoaDonDTO {
  maHoaDon: string;
  maNguoiDung?: string;
  maBaiDang?: string | null;
  maGoiDangBai?: string | null;
  trangThaiThanhToan: string;
  trangThaiHieuLuc: string;
  loaiHoaDon: string;
  soTien?: number;
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  noiDungChuyenKhoan?: string | null;
  ghiChu?: string | null;
  ngayTao?: string | null;
  ngayThanhToan?: string | null;
}

export const createSepayPayment = async (payload: SepayCreatePaymentRequest) => {
  const res = await axiosClient.post<SepayCreatePaymentResponse>(
    "/api/v1/sepay/create-payment",
    payload
  );
  return res.data;
};

export const getHoaDonById = async (maHoaDon: string) => {
  const res = await axiosClient.get<HoaDonDTO>(`/api/v1/hoa-don/${maHoaDon}`);
  return res.data;
};

export const getHoaDonByNguoiDung = async (maNguoiDung: string) => {
  const res = await axiosClient.get<HoaDonDTO[]>(`/api/v1/hoa-don/nguoi-dung/${maNguoiDung}`);
  return res.data;
};


export const getRecommendedPosts = async (maNguoiDung: string) => {
  const res = await axiosClient.get<BaiDangDTO[]>(
    `/api/v1/recommendation/${maNguoiDung}`
  );

  return res.data;
};

export interface AiPostContentRequest {
  loaiCanHo?: string;
  gia?: number;
  dienTich?: number;
  diaChi?: string;
  phuong?: string;
  phongNgu?: number;
  lienHe?: string;
}

export interface AiPostContentResponse {
  tieuDe: string;
  noiDung: string;
}

export const generatePostContentByAI = async (
  payload: AiPostContentRequest
) => {
  const res = await axiosClient.post<AiPostContentResponse>(
    '/api/v1/ai/generate-post-content',
    payload
  );

  return res.data;
};


export interface ChatbotRequestDTO {
  maNguoiDung?: string;
  message: string;
}

export interface ChatbotSuggestionDTO {
  maBaiDang: string;
  tieuDe: string;
  gia: number;
  phuong?: string;
  diaChi?: string;
  link?: string;
}

export interface ChatbotResponseDTO {
  answer: string;
  intent: string;
  suggestions: ChatbotSuggestionDTO[];
}

export const askChatbot = async (payload: ChatbotRequestDTO) => {
  const res = await axiosClient.post<ChatbotResponseDTO>(
    '/api/v1/chatbot/ask',
    payload
  );

  return res.data;
};

export interface RentPriceAnalysisRequest {
  loaiCanHo?: string;
  giaDeXuat?: number;
  dienTich?: number;
  phuong?: string;
  diaChi?: string;
  phongNgu?: number;

  coBanCong?: boolean;
  dayDuNoiThat?: boolean;
  coMayLanh?: boolean;
  coThangMay?: boolean;
  coMayGiat?: boolean;
  coNhaXe?: boolean;
  coTuLanh?: boolean;
  gioGiacTuDo?: boolean;
  ganTrungTam?: boolean;
  ganBien?: boolean;
}

export interface RentPriceAnalysisResponse {
  mucDoHopLy: string;
  giaThap: number;
  giaCao: number;
  giaKhuyenNghi: number;
  nhanXet: string;
  chienLuoc: string;
}

export const analyzeRentPrice = async (
  payload: RentPriceAnalysisRequest
) => {
  const res = await axiosClient.post<RentPriceAnalysisResponse>(
    '/api/v1/ai/rent-price-analysis',
    payload
  );

  return res.data;
};
