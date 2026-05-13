import React from 'react';
import './PricingTable.css';

type PricingTableProps = {
  onPayment: () => Promise<void>;
  loading: boolean;
};

const PricingTable: React.FC<PricingTableProps> = ({
  onPayment,
  loading,
}) => {
  return (
    <div className="pricing-table-wrapper">
      <table className="pricing-table">
        <thead>
          <tr>
            <th></th>

            <th className="vip-noi-bat">
              <div className="package-title">TIN VIP NỔI BẬT</div>
              <div className="stars">★★★★★</div>
            </th>

            <th className="vip-1">
              <div className="package-title">TIN VIP 1</div>
              <div className="stars">★★★★★</div>
            </th>

            <th className="vip-2">
              <div className="package-title">TIN VIP 2</div>
              <div className="stars">★★★★★</div>
            </th>

            <th className="vip-3">
              <div className="package-title">TIN VIP 3</div>
              <div className="stars">★★★★★</div>
            </th>

            <th className="tin-thuong">
              <div className="package-title">TIN THƯỜNG</div>
              <div className="stars">★★★★★</div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="label">Giá gói (30 ngày)</td>

            <td>1.684.800đ</td>
            <td>1.010.880đ</td>
            <td>673.920đ</td>
            <td>336.960đ</td>

            <td className="price-normal">
              50.000đ
            </td>
          </tr>

          <tr>
            <td className="label">Giá đẩy tin</td>

            <td>5.400đ</td>
            <td>3.240đ</td>
            <td>2.160đ</td>
            <td>2.160đ</td>
            <td>2.160đ</td>
          </tr>

          <tr>
            <td className="label">Màu sắc tiêu đề</td>

            <td>MÀU ĐỎ, IN HOA</td>
            <td>MÀU HỒNG, IN HOA</td>
            <td>MÀU CAM, IN HOA</td>
            <td>MÀU XANH, IN HOA</td>
            <td>Màu mặc định</td>
          </tr>

          <tr>
            <td className="label">Kích thước tin</td>

            <td>Rất lớn</td>
            <td>Lớn</td>
            <td>Trung bình</td>
            <td>Trung bình</td>
            <td>Nhỏ</td>
          </tr>

          <tr>
            <td className="label">Tự động duyệt (*)</td>

            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>—</td>
          </tr>

          <tr>
            <td className="label">Duy trì thêm 10 ngày tin thường</td>

            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>—</td>
          </tr>

          <tr>
            <td className="label">Hiển thị nút gọi điện</td>

            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>—</td>
          </tr>

          <tr>
            <td></td>

            {/* VIP NỔI BẬT */}
            <td>
              <button
                className="pricing-btn vip-noi-bat-btn"
                type="button"
              >
                Thanh toán ngay
              </button>
            </td>

            {/* VIP 1 */}
            <td>
              <button
                className="pricing-btn vip-1-btn"
                type="button"
              >
                Thanh toán ngay
              </button>
            </td>

            {/* VIP 2 */}
            <td>
              <button
                className="pricing-btn vip-2-btn"
                type="button"
              >
                Thanh toán ngay
              </button>
            </td>

            {/* VIP 3 */}
            <td>
              <button
                className="pricing-btn vip-3-btn"
                type="button"
              >
                Thanh toán ngay
              </button>
            </td>

            {/* TIN THƯỜNG */}
            <td>
              <button
                className="pricing-btn normal-btn"
                type="button"
                onClick={onPayment}
                disabled={loading}
              >
                {loading
                  ? 'Đang tạo thanh toán...'
                  : 'Thanh toán ngay'}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;