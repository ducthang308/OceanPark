import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Spin,
  Tag,
} from "antd";
import {
  CameraOutlined,
  EditOutlined,
  EyeOutlined,
  HomeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/layout/Navbar/navbar";
import "./listPost.css";
import cloverImg from "../../../../assets/img/co4la.png";
import {
  getApartmentDetailByPost,
  getCategories,
  getPostImages,
  getPostImageUrls,
  getPostVideoUrls,
  getPostById,
  getPosts,
  updatePost,
  updateApartmentDetail,
  type DanhMucDTO,
  type BaiDangDTO,
} from "../../../../services/api/PostManagementService";

interface PostItem {
  id: string;
  title: string;
  price: string;
  area: string;
  location: string;
  postId: string;
  thumbnail?: string;
  imageCount: number;
  videoCount: number;
  status: string;
  type: string;
  createdAt?: string;
  maDanhMuc?: string;
  noiDung?: string;
  lienHe?: string;
  hinhThucThanhToan?: string;
  rawStatus?: string;
  apartmentDetailId?: string;
  rawGia?: number;
  rawDienTich?: number;
  rawPhongNgu?: number;
  rawDiaChiCuThe?: string;
  rawHuongCanHo?: string;
  rawPhuong?: string;
  rawLat?: number;
  rawLng?: number;
}

interface EditPostFormValues {
  tieuDe: string;
  noiDung?: string;
  lienHe?: string;
  phuongThucThanhToan?: string;
  gia?: number;
  dienTich?: number;
  phongNgu?: number;
  diaChiCuThe?: string;
  phuong?: string;
  huongCanHo?: string;
  lat?: number;
  lng?: number;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Chưa có";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
};

const mapStatusText = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
      return "ĐANG HIỂN THỊ";
    case "HIDDEN":
    case "INACTIVE":
      return "ẨN TIN";
    case "PENDING":
      return "CHỜ DUYỆT";
    case "REJECTED":
    case "TU_CHOI":
      return "TỪ CHỐI";
    case "EXPIRED":
      return "HẾT HẠN";
    default:
      return status || "KHÔNG XÁC ĐỊNH";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ĐANG HIỂN THỊ":
      return "green";
    case "CHỜ DUYỆT":
      return "processing";
    case "CHỜ THANH TOÁN":
      return "gold";
    case "TỪ CHỐI":
    case "HẾT HẠN":
      return "red";
    case "ẨN TIN":
      return "default";
    default:
      return "blue";
  }
};

const PENDING_POST_IDS_KEY_PREFIX = "pendingPostIds:";
const PUBLIC_POST_STATUSES = new Set(["ACTIVE", "APPROVED"]);

const getLocalPendingPostIds = (maNguoiDung: string) => {
  const rawValue = localStorage.getItem(`${PENDING_POST_IDS_KEY_PREFIX}${maNguoiDung}`);
  if (!rawValue) return [];

  try {
    const value = JSON.parse(rawValue);
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const saveLocalPendingPostIds = (maNguoiDung: string, ids: string[]) => {
  localStorage.setItem(
    `${PENDING_POST_IDS_KEY_PREFIX}${maNguoiDung}`,
    JSON.stringify(Array.from(new Set(ids)))
  );
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

const shouldKeepLocalPost = (post: BaiDangDTO, maNguoiDung: string) => {
  const status = (post.trangThai || "").toUpperCase();
  return post.maNguoiDung === maNguoiDung && !PUBLIC_POST_STATUSES.has(status);
};

const ListPost = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<EditPostFormValues>();
  const [searchValue, setSearchValue] = useState("");
  const [postList, setPostList] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<DanhMucDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string>("");
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadPosts = async () => {
    const maNguoiDung = localStorage.getItem("userId");

    try {
      setLoading(true);

      const localPendingPostIds = maNguoiDung ? getLocalPendingPostIds(maNguoiDung) : [];
      const [posts, localPosts, categories] = await Promise.all([
        getPosts(),
        Promise.all(
          localPendingPostIds.map((id) => getPostById(id).catch(() => null))
        ),
        getCategories(),
      ]);
      setCategories(categories);
      const categoryMap = new Map(
        categories.map((category) => [category.maDanhMuc, category.tenDanhMuc])
      );

      const localVisiblePosts = maNguoiDung
        ? localPosts.filter((post): post is BaiDangDTO =>
            Boolean(post && shouldKeepLocalPost(post, maNguoiDung))
          )
        : [];

      if (maNguoiDung) {
        saveLocalPendingPostIds(
          maNguoiDung,
          localVisiblePosts.map((post) => post.maBaiDang).filter(Boolean) as string[]
        );
      }

      const myPosts = maNguoiDung
        ? mergePostsById([
            ...posts.filter((post) => post.maNguoiDung === maNguoiDung),
            ...localVisiblePosts,
          ])
        : posts;

      const mappedPosts = await Promise.all(
        myPosts.map(async (post) => {
          const maBaiDang = post.maBaiDang || "";

          const [detail, images] = await Promise.all([
            maBaiDang
              ? getApartmentDetailByPost(maBaiDang).catch(() => null)
              : Promise.resolve(null),
            maBaiDang ? getPostImages(maBaiDang).catch(() => []) : Promise.resolve([]),
          ]);
          const sortedMedia = [...images].sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0));
          const gallery = getPostImageUrls(sortedMedia);
          const videoUrls = getPostVideoUrls(sortedMedia);

          return {
            id: maBaiDang,
            title: post.tieuDe || "Không có tiêu đề",
            price: detail?.gia
              ? `${detail.gia.toLocaleString("vi-VN")} đồng/tháng`
              : "Chưa có giá",
            area: detail?.dienTich ? `${detail.dienTich} m²` : "Chưa có diện tích",
            location: detail?.diaChiCuThe || detail?.phuong || "Chưa có địa chỉ",
            postId: maBaiDang,
            thumbnail: gallery[0],
            imageCount: gallery.length,
            videoCount: videoUrls.length,
            status: mapStatusText(post.trangThai),
            type:
              categoryMap.get(post.maDanhMuc || "") ||
              post.maDanhMuc ||
              "Chưa có danh mục",
            createdAt: post.ngayDang,
            maDanhMuc: post.maDanhMuc,
            noiDung: post.noiDung,
            lienHe: post.lienHe,
            hinhThucThanhToan: post.hinhThucThanhToan,
            rawStatus: post.trangThai,
            apartmentDetailId: detail?.maChiTietCanHo,
            rawGia: detail?.gia,
            rawDienTich: detail?.dienTich,
            rawPhongNgu: detail?.phongNgu,
            rawDiaChiCuThe: detail?.diaChiCuThe,
            rawHuongCanHo: detail?.huongCanHo,
            rawPhuong: detail?.phuong,
            rawLat: detail?.lat,
            rawLng: detail?.lng,
          };
        })
      );

      setPostList(mappedPosts);
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách bài đăng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return postList;

    return postList.filter(
      (post) =>
        post.title.toLowerCase().includes(keyword) ||
        post.postId.toLowerCase().includes(keyword)
    );
  }, [postList, searchValue]);
  const visiblePostCount = filteredPosts.length;
  const totalPostCount = postList.length;

  const toggleVisibility = async (post: PostItem) => {
    const nextStatus = post.status === "ĐANG HIỂN THỊ" ? "HIDDEN" : "PENDING";

    try {
      setUpdatingId(post.id);
      await updatePost(post.id, { trangThai: nextStatus });
      message.success("Cập nhật trạng thái thành công");
      await loadPosts();
    } catch (error) {
      console.error(error);
      message.error("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingId("");
    }
  };

  const openPostDetail = (post: PostItem) => {
    navigate(`/posts/${post.id}`);
  };

  const handlePostCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    post: PostItem,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPostDetail(post);
    }
  };

  const openEditModal = (post: PostItem) => {
    setEditingPost(post);
    form.setFieldsValue({
      tieuDe: post.title,
      noiDung: post.noiDung,
      lienHe: post.lienHe,
      phuongThucThanhToan: post.hinhThucThanhToan,
      gia: post.rawGia,
      dienTich: post.rawDienTich,
      phongNgu: post.rawPhongNgu,
      diaChiCuThe: post.rawDiaChiCuThe,
      phuong: post.rawPhuong,
      huongCanHo: post.rawHuongCanHo,
      lat: post.rawLat,
      lng: post.rawLng,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
    form.resetFields();
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const values = await form.validateFields();
      setIsSavingEdit(true);

      await updatePost(editingPost.id, {
        tieuDe: values.tieuDe,
        noiDung: values.noiDung,
        lienHe: values.lienHe,
        hinhThucThanhToan: values.phuongThucThanhToan,
      });

      if (editingPost.apartmentDetailId) {
        await updateApartmentDetail(editingPost.apartmentDetailId, {
          gia: values.gia,
          dienTich: values.dienTich,
          phongNgu: values.phongNgu,
          diaChiCuThe: values.diaChiCuThe,
          phuong: values.phuong,
          huongCanHo: values.huongCanHo,
          lat: values.lat,
          lng: values.lng,
        });
      }

      message.success("Cập nhật bài đăng thành công");
      closeEditModal();
      await loadPosts();
    } catch (error) {
      console.error(error);
      message.error("Cập nhật bài đăng thất bại");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="post-page-layout">
      <Navbar />

      <div className="post-content-area">
        <div className="post-container">
          <div className="post-page-header">
            <div className="post-page-heading">
              <h2 className="post-page-title">Danh sách bài đăng</h2>
              <p className="post-page-subtitle">
                Quản lý các bài đăng của bạn trực quan và dễ dàng hơn
              </p>
            </div>

            <div className="post-search-panel">
              <Input
                className="search-input-post"
                placeholder="Tìm mã tin, tiêu đề..."
                prefix={<SearchOutlined />}
                allowClear
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
              <div className="post-search-count">
                <strong>{visiblePostCount}</strong>
                <span>/ {totalPostCount} tin</span>
              </div>
            </div>
          </div>

          <div className="list-container">
            {loading ? (
              <div className="empty-post">
                <Spin />
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem chi tiết ${post.title}`}
                  onClick={() => openPostDetail(post)}
                  onKeyDown={(event) => handlePostCardKeyDown(event, post)}
                >
                  <div className="post-thumbnail">
                    <img
                      src={post.thumbnail?.trim() ? post.thumbnail : cloverImg}
                      alt={post.title}
                      onError={(event) => {
                        event.currentTarget.src = cloverImg;
                      }}
                    />

                    <div className="post-overlay">
                      <Tag color={getStatusColor(post.status)}>{post.status}</Tag>
                    </div>

                    <div className="post-camera-icon">
                      <CameraOutlined />
                      <span>{post.imageCount}</span>
                    </div>
                  </div>

                  <div className="post-info">
                    <div className="post-top-row">
                      <div className="post-badge-group">
                        <Tag color="blue">{post.type}</Tag>
                        {post.videoCount > 0 && <Tag color="geekblue">Có video</Tag>}
                      </div>
                    </div>

                    <h3 className="post-title">{post.title}</h3>

                    <div className="post-meta">
                      <span className="post-price">{post.price}</span>
                      <span className="meta-dot">•</span>
                      <span className="post-size">{post.area}</span>
                      <span className="meta-dot">•</span>
                      <span className="post-location">{post.location}</span>
                    </div>

                    <div className="post-details">
                      <div className="post-detail-item">
                        <span className="label">Mã tin</span>
                        <strong>{post.postId}</strong>
                      </div>

                      <div className="post-detail-item">
                        <span className="label">Ngày đăng</span>
                        <strong>{formatDate(post.createdAt)}</strong>
                      </div>

                      <div className="post-detail-item">
                        <span className="label">Trạng thái</span>
                        <strong>{post.status}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="post-actions">
                    <Button
                      className="detail-btn"
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        openPostDetail(post);
                      }}
                    >
                      Chi tiết
                    </Button>

                    <Button
                      className="edit-btn"
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(post);
                      }}
                    >
                      Sửa tin
                    </Button>

                    <Button
                      className={`status-btn ${
                        post.status === "ĐANG HIỂN THỊ" ? "rented" : "available"
                      }`}
                      icon={<HomeOutlined />}
                      loading={updatingId === post.id}
                      disabled={post.status === "CHỜ DUYỆT"}
                      onClick={(event) => {
                        event.stopPropagation();

                        if (post.status === "ĐANG HIỂN THỊ" || post.status === "ẨN TIN") {
                          toggleVisibility(post);
                        } else {
                          navigate(`/payment/${post.id}`);
                        }
                      }}
                    >
                      {post.status === "ĐANG HIỂN THỊ"
                        ? "Ẩn tin"
                        : post.status === "CHỜ DUYỆT"
                          ? "Chờ duyệt"
                          : post.status === "ẨN TIN"
                            ? "Gửi duyệt lại"
                            : "Mua gói đăng tin"}
                    </Button>
                  </div>
                </div>
              ))
            )}

            {!loading && filteredPosts.length === 0 && (
              <div className="empty-post">Không tìm thấy bài đăng phù hợp.</div>
            )}
          </div>

          <Modal
            title={`Sửa bài đăng ${editingPost?.postId || ""}`}
            open={isEditModalOpen}
            onCancel={closeEditModal}
            onOk={handleSaveEdit}
            okText="Lưu thay đổi"
            cancelText="Hủy"
            confirmLoading={isSavingEdit}
            width={820}
            destroyOnHidden
          >
            <Form form={form} layout="vertical" className="edit-post-form">
              <Form.Item label="Danh mục">
                <Select
                  disabled
                  value={editingPost?.maDanhMuc}
                  options={categories.map((category) => ({
                    label: category.tenDanhMuc,
                    value: category.maDanhMuc,
                  }))}
                  placeholder="BE hiện chưa hỗ trợ sửa danh mục"
                />
              </Form.Item>

              <Form.Item
                name="tieuDe"
                label="Tiêu đề"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Nhập tiêu đề bài đăng" />
              </Form.Item>

              <Form.Item
                name="noiDung"
                label="Nội dung mô tả"
                rules={[{ required: true, message: "Vui lòng nhập nội dung mô tả" }]}
              >
                <Input.TextArea rows={5} placeholder="Nhập nội dung mô tả" />
              </Form.Item>

              <div className="edit-post-grid">
                <Form.Item
                  name="gia"
                  label="Giá cho thuê"
                  rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                >
                  <InputNumber
                    min={0}
                    addonAfter="đ/tháng"
                    style={{ width: "100%" }}
                    placeholder="Nhập giá"
                  />
                </Form.Item>

                <Form.Item
                  name="dienTich"
                  label="Diện tích"
                  rules={[{ required: true, message: "Vui lòng nhập diện tích" }]}
                >
                  <InputNumber
                    min={0}
                    addonAfter="m²"
                    style={{ width: "100%" }}
                    placeholder="Nhập diện tích"
                  />
                </Form.Item>

                <Form.Item
                  name="phongNgu"
                  label="Phòng ngủ"
                  rules={[{ required: true, message: "Vui lòng nhập số phòng ngủ" }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Nhập số phòng ngủ"
                  />
                </Form.Item>

                <Form.Item
                  name="phuongThucThanhToan"
                  label="Phương thức thanh toán"
                  rules={[
                    { required: true, message: "Vui lòng chọn phương thức thanh toán" },
                  ]}
                >
                  <Select
                    placeholder="Chọn phương thức thanh toán"
                    options={[
                      { label: "Tiền mặt", value: "Cash" },
                      { label: "Chuyển khoản", value: "Transfer" },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="diaChiCuThe"
                label="Địa chỉ cụ thể"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
              >
                <Input placeholder="Nhập địa chỉ cụ thể" />
              </Form.Item>

              <div className="edit-post-grid">
                <Form.Item
                  name="phuong"
                  label="Phường"
                  rules={[{ required: true, message: "Vui lòng nhập phường" }]}
                >
                  <Input placeholder="Nhập phường" />
                </Form.Item>

                <Form.Item
                  name="huongCanHo"
                  label="Hướng căn hộ"
                  rules={[{ required: true, message: "Vui lòng chọn hướng căn hộ" }]}
                >
                  <Select
                    placeholder="Chọn hướng căn hộ"
                    options={[
                      "Đông",
                      "Tây",
                      "Nam",
                      "Bắc",
                      "Đông Bắc",
                      "Đông Nam",
                      "Tây Bắc",
                      "Tây Nam",
                    ].map((item) => ({ label: item, value: item }))}
                  />
                </Form.Item>

                <Form.Item name="lat" label="Latitude">
                  <InputNumber style={{ width: "100%" }} placeholder="Vĩ độ" />
                </Form.Item>

                <Form.Item name="lng" label="Longitude">
                  <InputNumber style={{ width: "100%" }} placeholder="Kinh độ" />
                </Form.Item>
              </div>

              <Form.Item name="lienHe" label="Liên hệ">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ListPost;
