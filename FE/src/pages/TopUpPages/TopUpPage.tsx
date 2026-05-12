import { useEffect, useMemo, useState } from "react";
import { Button, Select, Spin, Tag, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./TopUpPage.css";
import Navbar from "../../components/layout/Navbar/navbar";
import { useAuth } from "../../hooks/useAuth";
import { getPosts } from "../../services/api/PostManagementService";
import {
  ACTIVATION_DURATIONS,
  POST_ACTIVATION_PLANS,
  createSepayPayment,
  formatPaymentMoney,
  getActivationPlanPrice,
  type ActivationDuration,
  type SepayCreatePaymentResponse,
} from "../../services/api/PaymentService";

interface PostPackageTarget {
  maBaiDang: string;
  tieuDe: string;
  trangThai?: string;
}

const TopUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostPackageTarget[]>([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("vip-2");
  const [selectedDuration, setSelectedDuration] = useState<ActivationDuration>(30);
  const [vatIncluded, setVatIncluded] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<SepayCreatePaymentResponse | null>(null);

  const selectedPlan = useMemo(
    () =>
      POST_ACTIVATION_PLANS.find((plan) => plan.id === selectedPlanId) ||
      POST_ACTIVATION_PLANS[0],
    [selectedPlanId]
  );

  const selectedPost = useMemo(
    () => posts.find((post) => post.maBaiDang === selectedPostId) || null,
    [posts, selectedPostId]
  );

  const total = useMemo(
    () => getActivationPlanPrice(selectedPlan, selectedDuration, vatIncluded),
    [selectedPlan, selectedDuration, vatIncluded]
  );

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoadingPosts(true);
        const allPosts = await getPosts();
        const myPosts = user?.maNguoiDung
          ? allPosts.filter((post) => post.maNguoiDung === user.maNguoiDung)
          : allPosts;

        const mappedPosts = myPosts
          .filter((post) => Boolean(post.maBaiDang))
          .map((post) => ({
            maBaiDang: post.maBaiDang || "",
            tieuDe: post.tieuDe || "Bài đăng chưa có tiêu đề",
            trangThai: post.trangThai,
          }));

        setPosts(mappedPosts);
        setSelectedPostId((current) => current || mappedPosts[0]?.maBaiDang || "");
      } catch (error) {
        console.error(error);
        message.error("Không tải được danh sách bài đăng");
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [user?.maNguoiDung]);

  const handleCreatePayment = async () => {
    if (!user?.maNguoiDung) {
      message.error("Vui lòng đăng nhập để mua gói đăng tin");
      return;
    }

    if (!selectedPostId) {
      message.error("Vui lòng chọn bài đăng cần kích hoạt");
      return;
    }

    try {
      setCreatingPayment(true);

      const response = await createSepayPayment({
        maNguoiDung: user.maNguoiDung,
        maBaiDang: selectedPostId,
        loaiHoaDon: "DANG_BAI",
        soTien: total,
        ghiChu: `Quản lý gói nạp - ${selectedPlan.name} - ${selectedDuration} ngày - ${selectedPostId}`,
      });

      setPaymentInfo(response);
      message.success("Đã tạo QR thanh toán");
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

  return (
    <div className="topup-layout">
      <div className="topup-sidebar">
        <Navbar />
      </div>

      <main className="topup-main">
        <section className="package-page-header">
          <div>
            <p>Thanh toán đăng tin</p>
            <h1>Quản lý gói nạp</h1>
          </div>

          <Button onClick={() => navigate("/list-post")}>Danh sách tin đăng</Button>
        </section>

        <section className="package-toolbar">
          <div className="package-toolbar__field">
            <label>Bài đăng cần kích hoạt</label>
            {loadingPosts ? (
              <div className="package-loading">
                <Spin size="small" /> Đang tải bài đăng
              </div>
            ) : (
              <Select
                value={selectedPostId || undefined}
                placeholder="Chọn bài đăng"
                onChange={setSelectedPostId}
                options={posts.map((post) => ({
                  value: post.maBaiDang,
                  label: `${post.maBaiDang} - ${post.tieuDe}`,
                }))}
                notFoundContent="Chưa có bài đăng"
                showSearch
                optionFilterProp="label"
              />
            )}
          </div>

          <label className="package-vat-switch">
            <span>Giá bao gồm 8% VAT</span>
            <input
              type="checkbox"
              checked={vatIncluded}
              onChange={(event) => setVatIncluded(event.target.checked)}
            />
          </label>
        </section>

        {posts.length === 0 && !loadingPosts ? (
          <section className="package-empty">
            <h2>Chưa có bài đăng để kích hoạt</h2>
            <p>Tạo bài đăng trước, sau đó chọn gói để thanh toán và hiển thị.</p>
            <Button type="primary" onClick={() => navigate("/listing")}>
              Đăng tin mới
            </Button>
          </section>
        ) : (
          <div className="package-content">
            <section className="package-plan-grid">
              {POST_ACTIVATION_PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className={`package-plan-card ${
                    selectedPlanId === plan.id ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className={`package-plan-card__head tone-${plan.tone}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <span>{plan.name}</span>
                    <strong>{"★".repeat(plan.stars) || "Gói cơ bản"}</strong>
                  </button>

                  <div className="package-plan-card__body">
                    <div className="package-plan-feature">
                      <span>Màu tiêu đề</span>
                      <strong>{plan.titleStyle}</strong>
                    </div>
                    <div className="package-plan-feature">
                      <span>Kích thước tin</span>
                      <strong>{plan.sizeLabel}</strong>
                    </div>
                    <div className="package-plan-feature">
                      <span>Tự động duyệt</span>
                      <strong>{plan.autoApprove ? "Có" : "Không"}</strong>
                    </div>

                    <div className="package-duration-list">
                      {ACTIVATION_DURATIONS.map((duration) => {
                        const active =
                          selectedPlanId === plan.id && selectedDuration === duration;

                        return (
                          <button
                            key={`${plan.id}-${duration}`}
                            type="button"
                            className={active ? "active" : ""}
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setSelectedDuration(duration);
                            }}
                          >
                            <span>{duration} ngày</span>
                            <strong>
                              {formatPaymentMoney(
                                getActivationPlanPrice(plan, duration, vatIncluded)
                              )}
                            </strong>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="package-checkout-card">
              <h2>Tóm tắt thanh toán</h2>

              <div className="package-selected-post">
                <span>Bài đăng</span>
                <strong>{selectedPost?.maBaiDang || "Chưa chọn"}</strong>
                {selectedPost?.trangThai && <Tag>{selectedPost.trangThai}</Tag>}
                <p>{selectedPost?.tieuDe || "Chọn bài đăng để mua gói kích hoạt"}</p>
              </div>

              <div className="package-summary-row">
                <span>Gói</span>
                <strong>{selectedPlan.name}</strong>
              </div>
              <div className="package-summary-row">
                <span>Thời hạn</span>
                <strong>{selectedDuration} ngày</strong>
              </div>
              <div className="package-summary-row">
                <span>Hóa đơn</span>
                <strong>DANG_BAI</strong>
              </div>

              <div className="package-total">
                <span>Tổng thanh toán</span>
                <strong>{formatPaymentMoney(total)}</strong>
              </div>

              <Button
                type="primary"
                block
                className="package-submit-btn"
                loading={creatingPayment}
                onClick={handleCreatePayment}
              >
                Tạo QR thanh toán
              </Button>

              {paymentInfo && (
                <div className="package-qr-box">
                  <img src={paymentInfo.qrUrl} alt="QR thanh toán SePay" />
                  <div className="package-bank-row">
                    <span>Nội dung CK</span>
                    <button
                      type="button"
                      onClick={() => copyText(paymentInfo.noiDungChuyenKhoan)}
                    >
                      {paymentInfo.noiDungChuyenKhoan}
                    </button>
                  </div>
                  <div className="package-bank-row">
                    <span>Số tài khoản</span>
                    <button
                      type="button"
                      onClick={() => copyText(paymentInfo.bankAccount)}
                    >
                      {paymentInfo.bankAccount}
                    </button>
                  </div>
                  <div className="package-bank-row">
                    <span>Chủ tài khoản</span>
                    <strong>{paymentInfo.accountName}</strong>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default TopUpPage;
