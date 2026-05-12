import { useEffect, useMemo, useState } from "react";
import { message, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import "./PaymentPage.css";
import cloverImg from "../../assets/img/co4la.png";
import { useAuth } from "../../hooks/useAuth";
import { homeMockData } from "../../services/mock/home.mock";
import {
  getApartmentDetailByPost,
  getCategories,
  getPostById,
  getPostImages,
} from "../../services/api/PostManagementService";
import {
  ACTIVATION_DURATIONS,
  POST_ACTIVATION_PLANS,
  createSepayPayment,
  formatPaymentMoney,
  getActivationPlanPrice,
  type ActivationDuration,
  type SepayCreatePaymentResponse,
} from "../../services/api/PaymentService";

interface PaymentPostInfo {
  maBaiDang: string;
  title: string;
  priceText: string;
  areaText: string;
  addressText: string;
  categoryText: string;
  coverImage: string;
}

const getMockPost = (id?: string) => {
  const allPosts = [...homeMockData.featuredPosts, ...homeMockData.newestPosts];
  const uniquePosts = allPosts.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
  );

  return uniquePosts.find((post) => String(post.id) === String(id));
};

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<PaymentPostInfo | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("vip-2");
  const [selectedDuration, setSelectedDuration] = useState<ActivationDuration>(30);
  const [vatIncluded, setVatIncluded] = useState(true);
  const [note, setNote] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<SepayCreatePaymentResponse | null>(null);

  const selectedPlan = useMemo(
    () =>
      POST_ACTIVATION_PLANS.find((plan) => plan.id === selectedPlanId) ||
      POST_ACTIVATION_PLANS[0],
    [selectedPlanId]
  );

  const total = useMemo(
    () => getActivationPlanPrice(selectedPlan, selectedDuration, vatIncluded),
    [selectedPlan, selectedDuration, vatIncluded]
  );

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setPost(null);
        setLoadingPost(false);
        return;
      }

      try {
        setLoadingPost(true);

        const [apiPost, categories] = await Promise.all([
          getPostById(id),
          getCategories().catch(() => []),
        ]);

        const maBaiDang = apiPost.maBaiDang || id;
        const category = categories.find(
          (item) => item.maDanhMuc === apiPost.maDanhMuc
        );

        const [detail, images] = await Promise.all([
          getApartmentDetailByPost(maBaiDang).catch(() => null),
          getPostImages(maBaiDang).catch(() => []),
        ]);

        setPost({
          maBaiDang,
          title: apiPost.tieuDe || "Bài đăng chưa có tiêu đề",
          priceText: detail?.gia
            ? `${detail.gia.toLocaleString("vi-VN")}đ/tháng`
            : "Chưa có giá thuê",
          areaText: detail?.dienTich ? `${detail.dienTich} m²` : "Chưa có diện tích",
          addressText: detail?.diaChiCuThe || detail?.phuong || "Chưa có địa chỉ",
          categoryText: category?.tenDanhMuc || apiPost.maDanhMuc || "Chưa phân loại",
          coverImage: images[0]?.thumbnailUrl || images[0]?.duongDan || cloverImg,
        });
      } catch (error) {
        const mockPost = getMockPost(id);

        if (!mockPost) {
          setPost(null);
          return;
        }

        setPost({
          maBaiDang: String(mockPost.id),
          title: mockPost.title,
          priceText: mockPost.priceText,
          areaText: mockPost.areaText,
          addressText: mockPost.addressText,
          categoryText: mockPost.categoryLabel,
          coverImage: mockPost.coverImage,
        });
      } finally {
        setLoadingPost(false);
      }
    };

    loadPost();
  }, [id]);

  const handleCreatePayment = async () => {
    if (!user?.maNguoiDung) {
      message.error("Vui lòng đăng nhập để thanh toán gói đăng tin");
      return;
    }

    if (!post?.maBaiDang) {
      message.error("Không tìm thấy mã bài đăng cần kích hoạt");
      return;
    }

    try {
      setCreatingPayment(true);

      const response = await createSepayPayment({
        maNguoiDung: user.maNguoiDung,
        maBaiDang: post.maBaiDang,
        loaiHoaDon: "DANG_BAI",
        soTien: total,
        ghiChu: [
          `Kích hoạt ${selectedPlan.name}`,
          `${selectedDuration} ngày`,
          `Bài đăng ${post.maBaiDang}`,
          note.trim(),
        ]
          .filter(Boolean)
          .join(" - "),
      });

      setPaymentInfo(response);
      message.success("Đã tạo mã QR thanh toán");
    } catch (error) {
      console.error(error);
      message.error("Tạo thanh toán thất bại");
    } finally {
      setCreatingPayment(false);
    }
  };

  const copyText = (value: string) => {
    void navigator.clipboard?.writeText(value);
    message.success("Đã sao chép");
  };

  if (loadingPost) {
    return (
      <div className="payment-page">
        <div className="payment-empty">
          <Spin />
          <p>Đang tải thông tin bài đăng...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="payment-page">
        <div className="payment-shell">
          <div className="payment-empty">
            <h2>Không tìm thấy bài đăng</h2>
            <p>Không thể tạo gói kích hoạt cho bài đăng này.</p>
            <button className="payment-back-btn" onClick={() => navigate("/list-post")}>
              Quay lại danh sách tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-shell">
        <div className="payment-breadcrumb">
          <span onClick={() => navigate("/list-post")}>Danh sách tin đăng</span>
          <span>/</span>
          <strong>Kích hoạt bài đăng</strong>
        </div>

        <div className="payment-layout">
          <section className="payment-main-card">
            <div className="payment-heading">
              <div>
                <p className="payment-heading-subtitle">Quản lý gói nạp</p>
                <h1 className="payment-heading-title">Chọn gói kích hoạt bài đăng</h1>
              </div>

              <label className="payment-vat-toggle">
                <span>Giá bao gồm 8% VAT</span>
                <input
                  type="checkbox"
                  checked={vatIncluded}
                  onChange={(event) => setVatIncluded(event.target.checked)}
                />
              </label>
            </div>

            <div className="payment-post-card">
              <img
                src={post.coverImage}
                alt={post.title}
                className="payment-post-image"
                onError={(event) => {
                  event.currentTarget.src = cloverImg;
                }}
              />

              <div className="payment-post-content">
                <div className="payment-post-code">{post.maBaiDang}</div>
                <h3 className="payment-post-title">{post.title}</h3>

                <div className="payment-post-meta">
                  <span>{post.priceText}</span>
                  <span>{post.areaText}</span>
                  <span>{post.categoryText}</span>
                </div>

                <p className="payment-post-address">{post.addressText}</p>
              </div>
            </div>

            <div className="payment-section">
              <h3 className="payment-section-title">Bảng gói hiển thị</h3>

              <div className="payment-plan-table">
                <div className="payment-plan-table__row payment-plan-table__head">
                  <div className="payment-plan-table__cell payment-plan-table__label" />
                  {POST_ACTIVATION_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      className={`payment-plan-head payment-plan-head--${plan.tone} ${
                        selectedPlanId === plan.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <strong>{plan.name}</strong>
                      <span>{"★".repeat(plan.stars)}</span>
                    </button>
                  ))}
                </div>

                {ACTIVATION_DURATIONS.map((duration) => (
                  <div key={duration} className="payment-plan-table__row">
                    <div className="payment-plan-table__cell payment-plan-table__label">
                      Giá {duration} ngày
                    </div>
                    {POST_ACTIVATION_PLANS.map((plan) => {
                      const isActive =
                        selectedPlanId === plan.id && selectedDuration === duration;

                      return (
                        <button
                          key={`${plan.id}-${duration}`}
                          type="button"
                          className={`payment-price-cell ${isActive ? "active" : ""}`}
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setSelectedDuration(duration);
                          }}
                        >
                          {formatPaymentMoney(
                            getActivationPlanPrice(plan, duration, vatIncluded)
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}

                <div className="payment-plan-table__row">
                  <div className="payment-plan-table__cell payment-plan-table__label">
                    Giá đẩy tin
                  </div>
                  {POST_ACTIVATION_PLANS.map((plan) => (
                    <div key={`${plan.id}-push`} className="payment-plan-table__cell">
                      {formatPaymentMoney(plan.pushPrice)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="payment-section">
              <h3 className="payment-section-title">Quyền lợi theo gói</h3>

              <div className="payment-benefit-grid">
                {POST_ACTIVATION_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`payment-benefit-card ${
                      selectedPlanId === plan.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className={`payment-benefit-card__title plan-${plan.tone}`}>
                      {plan.shortName}
                    </div>
                    <dl>
                      <div>
                        <dt>Màu tiêu đề</dt>
                        <dd>{plan.titleStyle}</dd>
                      </div>
                      <div>
                        <dt>Kích thước tin</dt>
                        <dd>{plan.sizeLabel}</dd>
                      </div>
                      <div>
                        <dt>Tự động duyệt</dt>
                        <dd>{plan.autoApprove ? "Có" : "Không"}</dd>
                      </div>
                      <div>
                        <dt>Nút gọi điện</dt>
                        <dd>{plan.callButton ? "Có" : "Không"}</dd>
                      </div>
                    </dl>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="payment-summary-card">
            <h3 className="payment-summary-title">Tóm tắt gói kích hoạt</h3>

            <div className="payment-summary-block">
              <div className="payment-summary-row">
                <span>Bài đăng</span>
                <strong>{post.maBaiDang}</strong>
              </div>
              <div className="payment-summary-row">
                <span>Gói đã chọn</span>
                <strong>{selectedPlan.name}</strong>
              </div>
              <div className="payment-summary-row">
                <span>Thời hạn</span>
                <strong>{selectedDuration} ngày</strong>
              </div>
              <div className="payment-summary-row">
                <span>Loại hóa đơn</span>
                <strong>DANG_BAI</strong>
              </div>
            </div>

            <label className="payment-note-field">
              <span>Ghi chú</span>
              <textarea
                rows={3}
                value={note}
                placeholder="Ghi chú nội bộ cho hóa đơn"
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            <div className="payment-total-box">
              <span>Tổng thanh toán</span>
              <strong>{formatPaymentMoney(total)}</strong>
            </div>

            <button
              className="payment-confirm-btn"
              type="button"
              onClick={handleCreatePayment}
              disabled={creatingPayment}
            >
              {creatingPayment ? "Đang tạo QR..." : "Tạo QR thanh toán"}
            </button>

            <button
              className="payment-secondary-btn"
              type="button"
              onClick={() => navigate("/history")}
            >
              Xem quản lý giao dịch
            </button>

            {paymentInfo && (
              <div className="payment-qr-card">
                <h4>Quét QR để thanh toán</h4>
                <img src={paymentInfo.qrUrl} alt="QR thanh toán SePay" />

                <div className="payment-bank-list">
                  <PaymentBankRow label="Ngân hàng" value={paymentInfo.bankCode} />
                  <PaymentBankRow
                    label="Số tài khoản"
                    value={paymentInfo.bankAccount}
                    onCopy={() => copyText(paymentInfo.bankAccount)}
                  />
                  <PaymentBankRow label="Chủ tài khoản" value={paymentInfo.accountName} />
                  <PaymentBankRow
                    label="Nội dung CK"
                    value={paymentInfo.noiDungChuyenKhoan}
                    onCopy={() => copyText(paymentInfo.noiDungChuyenKhoan)}
                  />
                  <PaymentBankRow
                    label="Số tiền"
                    value={formatPaymentMoney(paymentInfo.soTien)}
                  />
                </div>
              </div>
            )}

            <div className="payment-note-box">
              Sau khi SePay xác nhận giao dịch, hóa đơn chuyển sang SUCCESS và bài đăng
              được kích hoạt hiển thị theo gói đã mua.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const PaymentBankRow = ({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) => (
  <div className="payment-bank-row">
    <span>{label}</span>
    <strong>{value}</strong>
    {onCopy && (
      <button type="button" onClick={onCopy}>
        Sao chép
      </button>
    )}
  </div>
);

export default PaymentPage;
