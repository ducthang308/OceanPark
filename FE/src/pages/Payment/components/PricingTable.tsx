import React, { useState } from 'react';
import './PricingTable.css';
import { Modal, Radio, Button, Tag, Result } from 'antd';
import QR_MOCK from "../../../assets/img/Qr_CaNhan.jpg";

interface PackageInfo {
  name: string;
  stars: number;
  color: string;
  prices: {
    [key: string]: number;
  };
  pushPrice: number;
  titleColor: string;
  size: string;
  autoApprove: boolean;
  extraDays: boolean;
  showCallBtn: boolean;
}

const durations = [
  { label: '5 ngày', value: '5days' },
  { label: '10 ngày', value: '10days' },
  { label: '15 ngày', value: '15days' },
  { label: '30 ngày', value: '30days' },
];

const packages: PackageInfo[] = [
  {
    name: 'Tin VIP Nổi Bật',
    stars: 5,
    color: '#E03C31',
    prices: { '5days': 351000, '10days': 702000, '15days': 1053000, '30days': 1684800 },
    pushPrice: 5400,
    titleColor: 'MÀU ĐỎ, IN HOA',
    size: 'Rất lớn',
    autoApprove: true,
    extraDays: true,
    showCallBtn: true,
  },
  {
    name: 'Tin VIP 1',
    stars: 4,
    color: '#D81B60',
    prices: { '5days': 210600, '10days': 421200, '15days': 631800, '30days': 1010880 },
    pushPrice: 3240,
    titleColor: 'MÀU HỒNG, IN HOA',
    size: 'Lớn',
    autoApprove: true,
    extraDays: true,
    showCallBtn: true,
  },
  {
    name: 'Tin VIP 2',
    stars: 3,
    color: '#F4511E',
    prices: { '5days': 140400, '10days': 280800, '15days': 421200, '30days': 673920 },
    pushPrice: 2160,
    titleColor: 'MÀU CAM, IN HOA',
    size: 'Trung bình',
    autoApprove: true,
    extraDays: true,
    showCallBtn: true,
  },
  {
    name: 'Tin VIP 3',
    stars: 2,
    color: '#1E88E5',
    prices: { '5days': 70200, '10days': 140400, '15days': 210600, '30days': 336960 },
    pushPrice: 2160,
    titleColor: 'MÀU XANH, IN HOA',
    size: 'Trung bình',
    autoApprove: true,
    extraDays: true,
    showCallBtn: true,
  },
  {
    name: 'Tin thường',
    stars: 0,
    color: '#055699',
    prices: { '5days': 12420, '10days': 24840, '15days': 37260, '30days': 59400 },
    pushPrice: 2160,
    titleColor: 'Màu mặc định, viết thường',
    size: 'Nhỏ',
    autoApprove: false,
    extraDays: false,
    showCallBtn: false,
  },
];

const PricingTable: React.FC = () => {
  const [selectedDuration, setSelectedDuration] = useState('30days');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PackageInfo | null>(null);
  const [paymentStep, setPaymentStep] = useState<'qr' | 'success'>('qr');

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + 'đ';

  const handlePay = (pkg: PackageInfo) => {
    setSelectedPkg(pkg);
    setPaymentStep('qr');
    setIsModalOpen(true);
  };

  const simulateSuccess = () => {
    setPaymentStep('success');
  };

  return (
    <div className="pricing-container-outer">
      <div className="duration-selector">
        <span className="selector-label">Chọn thời gian đăng tin:</span>
        <Radio.Group 
          value={selectedDuration} 
          onChange={(e) => setSelectedDuration(e.target.value)}
          buttonStyle="solid"
          size="large"
        >
          {durations.map(d => (
            <Radio.Button key={d.value} value={d.value}>{d.label}</Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <div className="pricing-container">
        <div className="pricing-header-row">
          <div className="pricing-label-col">
             <div className="vat-toggle">
                <span>Giá bao gồm 10% VAT</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
             </div>
          </div>
          {packages.map((pkg, i) => (
            <div key={i} className="pricing-pkg-header" style={{ backgroundColor: pkg.color }}>
              <h3>{pkg.name}</h3>
              <div className="stars">
                {'★'.repeat(pkg.stars)}{'☆'.repeat(5 - pkg.stars)}
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Giá gói ({durations.find(d => d.value === selectedDuration)?.label})</div>
          {packages.map((pkg, i) => (
            <div key={i} className="pricing-value-col price-main">
              {formatPrice(pkg.prices[selectedDuration])}
            </div>
          ))}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Giá đẩy tin</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col">{formatPrice(pkg.pushPrice)}</div>)}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Màu sắc tiêu đề</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col feature-text" style={{ color: pkg.stars > 0 ? pkg.color : 'inherit' }}>{pkg.titleColor}</div>)}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Kích thước tin</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col">{pkg.size}</div>)}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Tự động duyệt (*)</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col">{pkg.autoApprove ? <span className="check">✔</span> : '—'}</div>)}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Duy trì thêm 10 ngày tin thường</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col">{pkg.extraDays ? <span className="check">✔</span> : '—'}</div>)}
        </div>

        <div className="pricing-row">
          <div className="pricing-label-col">Hiển thị nút gọi điện</div>
          {packages.map((pkg, i) => <div key={i} className="pricing-value-col">{pkg.showCallBtn ? <span className="check">✔</span> : '—'}</div>)}
        </div>

        <div className="pricing-footer-row">
          <div className="pricing-label-col"></div>
          {packages.map((pkg, i) => (
            <div key={i} className="pricing-action-col">
              <button 
                className="buy-btn" 
                style={{ backgroundColor: pkg.color }}
                onClick={() => handlePay(pkg)}
              >
                Thanh toán ngay
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={paymentStep === 'qr' ? "Quét mã để thanh toán gói dịch vụ" : "Thanh toán thành công"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        {selectedPkg && paymentStep === 'qr' && (
          <div className="payment-modal-content">
            <div className="pkg-summary">
              <h3>{selectedPkg.name}</h3>
              <p>Thời gian: <strong>{durations.find(d => d.value === selectedDuration)?.label}</strong></p>
              <div className="price-tag">{formatPrice(selectedPkg.prices[selectedDuration])}</div>
            </div>

            <div className="qr-box">
              <img 
                src={`https://img.vietqr.io/image/MB-0325043590-compact2.png?amount=${selectedPkg.prices[selectedDuration]}&addInfo=NAP_${selectedPkg.name.toUpperCase().replace(/\s/g, '_')}&accountName=NGUYEN_DUC_THANG`} 
                alt="QR Code" 
                style={{ width: '100%', maxWidth: 300, margin: '0 auto' }}
              />
              <div className="qr-note">
                <p>Nội dung chuyển khoản: <Tag color="red">NAP {selectedPkg.name.toUpperCase().replace(/\s/g, '_')}</Tag></p>
                <p>Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền.</p>
              </div>
            </div>

            <Button type="primary" block size="large" onClick={simulateSuccess}>
              Xác nhận đã chuyển khoản (Demo)
            </Button>
          </div>
        )}

        {paymentStep === 'success' && (
          <Result
            status="success"
            title="Thanh toán gói thành công!"
            subTitle="Bây giờ bạn đã có thể thực hiện đăng bài với gói dịch vụ vừa mua."
            extra={[
              <Button type="primary" key="post" onClick={() => window.location.href = '/listing'}>
                Đăng bài ngay
              </Button>,
              <Button key="close" onClick={() => setIsModalOpen(false)}>
                Đóng
              </Button>,
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default PricingTable;
