export type AdminKpi = {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend: string;
  note: string;
};

export type AdminChartRow = {
  month: string;
  approvedPosts: number;
  pendingPosts: number;
  approvedPayments: number;
};

export type AdminPostStatus = 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
export type AdminPaymentStatus = 'CHO_XAC_NHAN' | 'DA_THANH_TOAN' | 'THAT_BAI' | 'HOAN_TIEN';

export type AdminPost = {
  id: number;
  tieuDe: string;
  hoVaTenNguoiChoThue: string;
  soDienThoai: string;
  email: string;
  danhMuc: string;
  phuong: string;
  diaChiCuThe: string;
  gia: number;
  dienTich: number;
  phongNgu: number;
  trangThai: AdminPostStatus;
  ngayDang: string;
  phuongThucThanhToan: string;
  thumbnailUrl: string;
  tienIch: string[];
  lyDo?: string;
};

export type AdminPayment = {
  id: number;
  maGiaoDich: string;
  hoVaTen: string;
  soDienThoai: string;
  email: string;
  tenMucDich: string;
  tenPhuongThucThanhToan: string;
  soTien: number;
  trangThai: AdminPaymentStatus;
  ngayTao: string;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  noiDung: string;
};

export const adminKpis: AdminKpi[] = [
  {
    key: 'pendingPosts',
    label: 'Bài đăng chờ duyệt',
    value: 18,
    trend: '+6.2%',
    note: 'Tăng so với tuần trước',
  },
  {
    key: 'pendingPayments',
    label: 'Thanh toán chờ duyệt',
    value: 9,
    trend: '-2.1%',
    note: 'Giảm nhẹ nhờ đối soát tốt hơn',
  },
  {
    key: 'approvedThisMonth',
    label: 'Bài đăng duyệt tháng này',
    value: 126,
    trend: '+14.8%',
    note: 'Chủ yếu từ khu vực Sơn Trà và Hải Châu',
  },
  {
    key: 'revenue',
    label: 'Doanh thu phí đăng bài',
    value: 48350000,
    unit: 'VND',
    trend: '+8.4%',
    note: 'Tính từ giao dịch đã xác nhận',
  },
];

export const adminMonthlyStats: AdminChartRow[] = [
  { month: 'T1', approvedPosts: 56, pendingPosts: 12, approvedPayments: 40 },
  { month: 'T2', approvedPosts: 63, pendingPosts: 10, approvedPayments: 47 },
  { month: 'T3', approvedPosts: 70, pendingPosts: 8, approvedPayments: 52 },
  { month: 'T4', approvedPosts: 82, pendingPosts: 14, approvedPayments: 68 },
  { month: 'T5', approvedPosts: 91, pendingPosts: 11, approvedPayments: 72 },
  { month: 'T6', approvedPosts: 126, pendingPosts: 18, approvedPayments: 87 },
];

export const adminPosts: AdminPost[] = [
  {
    id: 101,
    tieuDe: 'Căn hộ 2PN full nội thất gần biển Mỹ Khê',
    hoVaTenNguoiChoThue: 'Nguyễn Minh Anh',
    soDienThoai: '0905123456',
    email: 'minhanh@gmail.com',
    danhMuc: 'Cho thuê căn hộ',
    phuong: 'Phước Mỹ',
    diaChiCuThe: '45 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    gia: 13500000,
    dienTich: 68,
    phongNgu: 2,
    trangThai: 'CHO_DUYET',
    ngayDang: '2026-04-20T09:15:00',
    phuongThucThanhToan: 'VNPay',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    tienIch: ['Ban công', 'Hồ bơi', 'Bãi đỗ xe', 'An ninh 24/7'],
  },
  {
    id: 102,
    tieuDe: 'Studio giá tốt gần cầu Rồng, phù hợp người đi làm',
    hoVaTenNguoiChoThue: 'Trần Thu Hà',
    soDienThoai: '0912345678',
    email: 'thuhada@gmail.com',
    danhMuc: 'Cho thuê studio',
    phuong: 'An Hải Bắc',
    diaChiCuThe: '12 An Trung 3, Sơn Trà, Đà Nẵng',
    gia: 6200000,
    dienTich: 34,
    phongNgu: 1,
    trangThai: 'DA_DUYET',
    ngayDang: '2026-04-18T14:00:00',
    phuongThucThanhToan: 'Momo',
    thumbnailUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    tienIch: ['Thang máy', 'Máy giặt', 'Wifi'],
  },
  {
    id: 103,
    tieuDe: 'Căn hộ 1PN trung tâm Hải Châu, nội thất mới 100%',
    hoVaTenNguoiChoThue: 'Lê Quốc Huy',
    soDienThoai: '0935888666',
    email: 'lequochuy@gmail.com',
    danhMuc: 'Cho thuê căn hộ',
    phuong: 'Hải Châu 1',
    diaChiCuThe: '88 Bạch Đằng, Hải Châu, Đà Nẵng',
    gia: 9800000,
    dienTich: 52,
    phongNgu: 1,
    trangThai: 'TU_CHOI',
    ngayDang: '2026-04-17T11:30:00',
    phuongThucThanhToan: 'Chuyển khoản',
    thumbnailUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    tienIch: ['Bếp riêng', 'Điều hòa'],
    lyDo: 'Nội dung mô tả thiếu rõ ràng và hình ảnh bị trùng lặp.',
  },
  {
    id: 104,
    tieuDe: 'Căn hộ 3PN view sông Hàn, phù hợp gia đình',
    hoVaTenNguoiChoThue: 'Phạm Thị Ngọc',
    soDienThoai: '0989111222',
    email: 'phamngoc@gmail.com',
    danhMuc: 'Cho thuê căn hộ cao cấp',
    phuong: 'Nại Hiên Đông',
    diaChiCuThe: '102 Trần Hưng Đạo, Sơn Trà, Đà Nẵng',
    gia: 22500000,
    dienTich: 115,
    phongNgu: 3,
    trangThai: 'CHO_DUYET',
    ngayDang: '2026-04-21T08:20:00',
    phuongThucThanhToan: 'ZaloPay',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    tienIch: ['Gym', 'Hồ bơi', 'Lễ tân', 'Công viên'],
  },
];

export const adminPayments: AdminPayment[] = [
  {
    id: 501,
    maGiaoDich: 'PAY-20260421-001',
    hoVaTen: 'Nguyễn Minh Anh',
    soDienThoai: '0905123456',
    email: 'minhanh@gmail.com',
    tenMucDich: 'Thanh toán để đăng bài',
    tenPhuongThucThanhToan: 'VNPay',
    soTien: 350000,
    trangThai: 'CHO_XAC_NHAN',
    ngayTao: '2026-04-21T09:20:00',
    noiDung: 'Gói đăng bài VIP 7 ngày cho bài đăng #101',
    ngayBatDau: '2026-04-21',
    ngayKetThuc: '2026-04-28',
  },
  {
    id: 502,
    maGiaoDich: 'PAY-20260420-004',
    hoVaTen: 'Trần Thu Hà',
    soDienThoai: '0912345678',
    email: 'thuhada@gmail.com',
    tenMucDich: 'Thanh toán để đăng bài',
    tenPhuongThucThanhToan: 'Momo',
    soTien: 150000,
    trangThai: 'DA_THANH_TOAN',
    ngayTao: '2026-04-20T14:05:00',
    noiDung: 'Gói đăng bài thường 3 ngày cho bài đăng #102',
    ngayBatDau: '2026-04-20',
    ngayKetThuc: '2026-04-23',
  },
  {
    id: 503,
    maGiaoDich: 'PAY-20260419-003',
    hoVaTen: 'Lê Quốc Huy',
    soDienThoai: '0935888666',
    email: 'lequochuy@gmail.com',
    tenMucDich: 'Thanh toán để đăng bài',
    tenPhuongThucThanhToan: 'Chuyển khoản',
    soTien: 250000,
    trangThai: 'THAT_BAI',
    ngayTao: '2026-04-19T18:10:00',
    noiDung: 'Đối soát thất bại do sai nội dung chuyển khoản',
  },
  {
    id: 504,
    maGiaoDich: 'PAY-20260421-007',
    hoVaTen: 'Phạm Thị Ngọc',
    soDienThoai: '0989111222',
    email: 'phamngoc@gmail.com',
    tenMucDich: 'Thanh toán để đăng bài',
    tenPhuongThucThanhToan: 'ZaloPay',
    soTien: 450000,
    trangThai: 'CHO_XAC_NHAN',
    ngayTao: '2026-04-21T10:45:00',
    noiDung: 'Gói đăng bài VIP 10 ngày cho bài đăng #104',
    ngayBatDau: '2026-04-21',
    ngayKetThuc: '2026-05-01',
  },
];
