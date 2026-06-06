import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSepayPayment } from '../../services/api/PostManagementService';
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_CLEARED_EVENT,
  getAuthSession,
} from '../../utils/storage';
import {
  APARTMENT_CART_CHANGED_EVENT,
  clearApartmentCart,
  getApartmentCartItems,
  removeApartmentCartItem,
  updateApartmentCartQuantity,
  type ApartmentCartItem,
} from '../../utils/apartmentCart';
import './ApartmentCartPage.css';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;

const ApartmentCartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<ApartmentCartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadCart = () => setItems(getApartmentCartItems());

  useEffect(() => {
    loadCart();
    window.addEventListener(APARTMENT_CART_CHANGED_EVENT, loadCart);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, loadCart);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, loadCart);
    window.addEventListener('storage', loadCart);

    return () => {
      window.removeEventListener(APARTMENT_CART_CHANGED_EVENT, loadCart);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, loadCart);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, loadCart);
      window.removeEventListener('storage', loadCart);
    };
  }, []);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const handleQuantityChange = (maBaiDang: string, quantity: number) => {
    setItems(updateApartmentCartQuantity(maBaiDang, quantity));
  };

  const handleRemove = (maBaiDang: string) => {
    setItems(removeApartmentCartItem(maBaiDang));
  };

  const handleCheckout = async () => {
    const maNguoiDung = getAuthSession()?.user.maNguoiDung || localStorage.getItem('userId');

    if (!maNguoiDung) {
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (items.length === 0 || totalAmount <= 0) {
      alert('Giỏ hàng chưa có căn hộ hợp lệ');
      return;
    }

    try {
      setSubmitting(true);

      const payment = await createSepayPayment({
        maNguoiDung,
        loaiHoaDon: 'THUE_CAN_HO',
        soTien: totalAmount,
        ghiChu: `Thanh toán ${totalQuantity} căn hộ trong giỏ hàng`,
        chiTietHoaDon: items.map((item) => ({
          maBaiDang: item.maBaiDang,
          soLuong: item.quantity,
          donGia: item.price,
          thanhTien: item.price * item.quantity,
          ghiChu: item.title,
        })),
      });

      navigate('/payment/sepay', {
        state: {
          ...payment,
          loaiHoaDon: 'THUE_CAN_HO',
          cartCheckoutPostIds: items.map((item) => item.maBaiDang),
        },
      });
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Không thể tạo thanh toán giỏ hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apartment-cart-page">
      <div className="apartment-cart-shell">
        <div className="apartment-cart-header">
          <div>
            <h1>Giỏ hàng căn hộ</h1>
          </div>
          <button type="button" onClick={() => navigate('/posts')}>
            Xem thêm căn hộ
          </button>
        </div>

        {items.length === 0 ? (
          <section className="apartment-cart-empty">
            <h2>Giỏ hàng đang trống</h2>
            <p>Chọn căn hộ phù hợp rồi thêm vào giỏ để thanh toán một lần.</p>
            <button type="button" onClick={() => navigate('/posts')}>
              Tìm căn hộ
            </button>
          </section>
        ) : (
          <div className="apartment-cart-layout">
            <section className="apartment-cart-list">
              {items.map((item) => (
                <article key={item.maBaiDang} className="apartment-cart-item">
                  <div className="apartment-cart-item__media">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} />
                    ) : (
                      <span>{item.title.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="apartment-cart-item__content">
                    <div className="apartment-cart-item__top">
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.address || item.ward || 'Đang cập nhật địa chỉ'}</p>
                      </div>
                      <strong>{formatCurrency(item.price)}</strong>
                    </div>

                    <div className="apartment-cart-item__meta">
                      <span>{item.areaText || 'Diện tích đang cập nhật'}</span>
                      <span>Còn trống: {item.availableQuantity}</span>
                    </div>

                    <div className="apartment-cart-item__actions">
                      <label>
                        Số lượng
                        <input
                          type="number"
                          min={1}
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(event) =>
                            handleQuantityChange(item.maBaiDang, Number(event.target.value))
                          }
                        />
                      </label>

                      <button type="button" onClick={() => handleRemove(item.maBaiDang)}>
                        Xóa khỏi giỏ
                      </button>

                      <button type="button" onClick={() => navigate(`/posts/${item.maBaiDang}`)}>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="apartment-cart-summary">
              <h2>Tổng thanh toán</h2>
              <div className="apartment-cart-summary__row">
                <span>Số căn</span>
                <strong>{totalQuantity}</strong>
              </div>
              <div className="apartment-cart-summary__row">
                <span>Số dòng hóa đơn</span>
                <strong>{items.length}</strong>
              </div>
              <div className="apartment-cart-summary__total">
                <span>Tổng tiền</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>

              <button
                type="button"
                className="apartment-cart-summary__checkout"
                disabled={submitting}
                onClick={handleCheckout}
              >
                {submitting ? 'Đang tạo thanh toán...' : 'Thanh toán'}
              </button>

              <button
                type="button"
                className="apartment-cart-summary__clear"
                onClick={() => {
                  clearApartmentCart();
                  setItems([]);
                }}
              >
                Xóa toàn bộ giỏ
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentCartPage;
