import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { InputNumber, Image, Tag } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import './TopUpPage.css';
import Navbar from '../../components/layout/Navbar/navbar';
import QR from '../../assets/img/QR.jpg';
import Qr_CaNhan from '../../assets/img/Qr_CaNhan.jpg';

const moneyOptions = [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000];

const tabList = [
  { label: 'QRCode', path: '/recharge/payoo', icon: '⚡' },
  { label: 'Ví MoMo', path: '/recharge/momo', icon: '💜' },
  { label: 'Thẻ ATM nội địa', path: '/recharge/atm', icon: '🏦' },
  { label: 'Thẻ quốc tế', path: '/recharge/card', icon: '💳' },
  { label: 'Chuyển khoản', path: '/recharge/bank', icon: '🔄' },
  { label: 'Điểm giao dịch', path: '/recharge/store', icon: '📍' },
];

const bonusRules = [
  { min: 2000000, pct: 25, label: 'Từ 2 triệu' },
  { min: 1000000, pct: 20, label: 'Từ 1 triệu' },
  { min: 100000, pct: 10, label: 'Từ 100K' },
];

const TopUpPage = () => {
  const [amount, setAmount] = useState<number>(500000);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const location = useLocation();

  const VAT_RATE = 0.1;
  const getBonus = (val: number) => {
    if (val >= 2000000) return 0.25;
    if (val >= 1000000) return 0.2;
    if (val >= 100000) return 0.1;
    return 0;
  };

  const vat = +(amount * VAT_RATE).toFixed(0);
  const afterTax = amount - vat;
  const bonusPct = getBonus(amount);
  const bonus = +(amount * bonusPct).toFixed(0);
  const totalReceive = afterTax + bonus;

  const formatMoney = (val: number) =>
    val >= 1000000
      ? (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + 'M'
      : val >= 1000
      ? (val / 1000).toFixed(0) + 'K'
      : val.toString();

  return (
    <div className="tu-layout">
      <Navbar />
      <div className="tu-content">
        {/* Header */}
        <div className="tu-header">
          <div className="tu-header__inner">
            <div className="tu-header__icon">💰</div>
            <div>
              <h1 className="tu-header__title">Nạp tiền vào tài khoản</h1>
              <p className="tu-header__sub">Chọn phương thức thanh toán phù hợp với bạn</p>
            </div>
          </div>
        </div>

        {/* Tab Swiper */}
        <div className="tu-tabs-wrap">
          <Swiper
            modules={[FreeMode]}
            freeMode
            slidesPerView="auto"
            spaceBetween={8}
            className="tu-tabs-swiper"
          >
            {tabList.map((tab) => (
              <SwiperSlide key={tab.path} style={{ width: 'auto' }}>
                <Link
                  to={tab.path}
                  className={`tu-tab${location.pathname === tab.path ? ' is-active' : ''}`}
                >
                  <span className="tu-tab__icon">{tab.icon}</span>
                  {tab.label}
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Bonus Banner */}
        <div className="tu-bonus-banner">
          {bonusRules.map((rule) => (
            <div
              key={rule.min}
              className={`tu-bonus-pill${amount >= rule.min ? ' is-active' : ''}`}
            >
              🎁 {rule.label} +{rule.pct}%
            </div>
          ))}
        </div>

        {/* Main area */}
        {!showQRCode ? (
          <div className="tu-grid">
            {/* Left: Amount picker */}
            <div className="tu-card">
              <div className="tu-card__header">
                <span className="tu-card__icon">💵</span>
                <h2>Chọn số tiền nạp</h2>
              </div>

              <div className="tu-money-grid">
                {moneyOptions.map((money) => (
                  <button
                    key={money}
                    type="button"
                    className={`tu-money-btn${amount === money ? ' is-selected' : ''}`}
                    onClick={() => setAmount(money)}
                  >
                    <span className="tu-money-btn__val">{formatMoney(money)}</span>
                    {getBonus(money) > 0 && (
                      <span className="tu-money-btn__badge">+{getBonus(money) * 100}%</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="tu-custom-input">
                <label>Hoặc nhập số tiền khác:</label>
                <InputNumber
                  min={10000}
                  step={10000}
                  value={amount}
                  onChange={(val) => setAmount(val || 0)}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => Number(val!.replace(/,/g, ''))}
                  addonAfter="đ"
                  className="tu-input-number"
                />
              </div>
            </div>

            {/* Right: Summary */}
            <div className="tu-card tu-card--summary">
              <div className="tu-card__header">
                <span className="tu-card__icon">📊</span>
                <h2>Chi tiết giao dịch</h2>
              </div>

              <div className="tu-summary-rows">
                <div className="tu-summary-row">
                  <span>Số tiền nạp</span>
                  <span className="tu-summary-row__val">{amount.toLocaleString()}đ</span>
                </div>
                <div className="tu-summary-row tu-summary-row--deduct">
                  <span>Thuế VAT (10%)</span>
                  <span>−{vat.toLocaleString()}đ</span>
                </div>
                <div className="tu-summary-row">
                  <span>Sau thuế</span>
                  <span>{afterTax.toLocaleString()}đ</span>
                </div>
                {bonus > 0 && (
                  <div className="tu-summary-row tu-summary-row--bonus">
                    <span>Khuyến mãi ({bonusPct * 100}%)</span>
                    <span>+{bonus.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="tu-summary-divider" />
                <div className="tu-summary-row tu-summary-row--total">
                  <span>Thực nhận</span>
                  <strong>{totalReceive.toLocaleString()}đ</strong>
                </div>
              </div>

              <button
                type="button"
                className="tu-submit-btn"
                onClick={() => setShowQRCode(true)}
              >
                Tiếp tục thanh toán →
              </button>
            </div>
          </div>
        ) : (
          <div className="tu-grid">
            {/* QR Code card */}
            <div className="tu-card tu-card--qr">
              <div className="tu-card__header">
                <span className="tu-card__icon">📲</span>
                <h2>Quét mã QR để thanh toán</h2>
              </div>
              <div className="tu-qr-box">
                <div className="tu-qr-amount">
                  <span>Số tiền:</span>
                  <strong>{amount.toLocaleString()}đ</strong>
                </div>
                <div className="tu-qr-img-wrap">
                  <Image width={220} src={Qr_CaNhan} alt="QR Code thanh toán" />
                </div>
                <p className="tu-qr-note">
                  Nội dung chuyển khoản:&nbsp;
                  <Tag color="orange" style={{ fontSize: 15, padding: '2px 10px' }}>
                    NAP {amount}
                  </Tag>
                </p>
                <button
                  type="button"
                  className="tu-back-btn"
                  onClick={() => setShowQRCode(false)}
                >
                  ← Quay lại
                </button>
              </div>
            </div>

            {/* Guide card */}
            <div className="tu-card">
              <div className="tu-card__header">
                <span className="tu-card__icon">📖</span>
                <h2>Hướng dẫn thanh toán</h2>
              </div>
              <Image src={QR} alt="Hướng dẫn thanh toán" style={{ borderRadius: 12 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpPage;
