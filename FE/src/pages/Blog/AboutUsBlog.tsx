import './AboutUsBlog.css';
import PageBanner from '../../components/sections/PageBanner/PageBanner';
import heroImage from '../../assets/img/img2.png';

export default function AboutUsPanels() {
  return (
    <>
      <PageBanner
        title="Về chúng tôi"
        backgroundImage={heroImage}
        breadcrumbs={[
          {
            label:
              'DThang Home xây dựng nền tảng tìm kiếm và đăng tin phòng trọ, căn hộ, nhà nguyên căn rõ ràng, dễ dùng và đáng tin cậy.',
          },
        ]}
        height="md"
      />

      <main className="about-page">
        <section className="about-panel">
          <div className="about-container grid-2">
            <div>
              <h2>Sứ mệnh</h2>
              <p>
                Sứ mệnh của chúng tôi là giúp việc tìm thuê phòng trọ, căn hộ và
                nhà ở trở nên đơn giản hơn. Người thuê cần nhìn thấy thông tin quan
                trọng ngay từ đầu, còn chủ nhà cần một nơi đăng tin và quản lý rõ
                ràng.
              </p>
              <p>
                Chúng tôi tin rằng một nền tảng tốt không chỉ có nhiều tin đăng, mà
                còn phải <strong>dễ tìm - dễ so sánh - dễ liên hệ</strong>.
              </p>
            </div>

            <div className="about-card">
              <h3>Triết lý phát triển</h3>
              <ul>
                <li>Ưu tiên trải nghiệm người thuê và chủ nhà</li>
                <li>Thông tin tin đăng rõ ràng, dễ kiểm tra</li>
                <li>Không đánh đổi sự minh bạch lấy thao tác nhanh</li>
                <li>Sẵn sàng mở rộng theo dữ liệu và nhu cầu thật</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-panel alt">
          <div className="about-container">
            <h2 className="center">Chúng tôi đang xây dựng gì?</h2>

            <div className="feature-grid">
              <div className="feature-card">
                <h3>Tìm phòng theo nhu cầu</h3>
                <p>
                  Lọc tin theo khu vực, mức giá, diện tích và loại hình để người
                  thuê rút ngắn thời gian tìm kiếm.
                </p>
              </div>

              <div className="feature-card">
                <h3>Tin đăng rõ ràng</h3>
                <p>
                  Mỗi bài đăng tập trung vào giá thuê, diện tích, địa chỉ, hình ảnh,
                  tiện ích và thông tin liên hệ.
                </p>
              </div>

              <div className="feature-card">
                <h3>Quản lý cho chủ nhà</h3>
                <p>
                  Chủ nhà có thể đăng tin, theo dõi bài đăng, nạp tiền và quản lý
                  giao dịch ngay trên tài khoản.
                </p>
              </div>

              <div className="feature-card">
                <h3>Dữ liệu có cấu trúc</h3>
                <p>
                  Danh mục, chi tiết căn hộ, hình ảnh và tiện ích được tổ chức rõ
                  ràng để dễ bảo trì và mở rộng.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-panel">
          <div className="about-container grid-2">
            <div className="about-highlight">
              <h2>Vì sao chọn chúng tôi?</h2>
              <p>
                Chúng tôi không chỉ tập trung vào số lượng tin đăng. Điều quan trọng
                hơn là chất lượng thông tin, trải nghiệm tìm kiếm và khả năng vận
                hành ổn định cho cả người thuê lẫn người cho thuê.
              </p>
            </div>

            <div className="about-card">
              <ul className="check-list">
                <li>Giao diện hiện đại, dễ đọc trên nhiều thiết bị</li>
                <li>Danh mục phòng trọ, căn hộ và nhà thuê rõ ràng</li>
                <li>Luồng quản lý tài khoản và giao dịch nhất quán</li>
                <li>Dễ tích hợp thêm API và dữ liệu thật từ backend</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
