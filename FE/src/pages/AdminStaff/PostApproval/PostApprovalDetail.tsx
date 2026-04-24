import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminPosts } from '../../../services/mock/adminStaff.mock';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-post-approval-detail.css';

const statusLabelMap: Record<string, { text: string; className: string }> = {
  CHO_DUYET: { text: 'Chờ duyệt', className: 'pending' },
  DA_DUYET: { text: 'Đã duyệt', className: 'approved' },
  TU_CHOI: { text: 'Từ chối', className: 'rejected' },
};

const PostApprovalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const post = adminPosts.find((item) => item.id === Number(id));

  if (!post) {
    return (
      <div className="post-detail-not-found">
        <h2>Không tìm thấy bài đăng</h2>
        <p>Bài đăng không tồn tại hoặc đã bị xóa.</p>
        <button
          type="button"
          className="post-detail-btn post-detail-btn--secondary"
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  const badge = statusLabelMap[post.trangThai] ?? { text: 'Không xác định', className: 'pending' };

  return (
    <div className="post-detail-page">
      {/* ── Breadcrumb / back ── */}
      <div className="post-detail-topbar">
        <button
          type="button"
          className="post-detail-btn post-detail-btn--back"
          onClick={() => navigate(-1)}
        >
          ← Quay lại danh sách
        </button>
        <span className={`post-detail-badge ${badge.className}`}>{badge.text}</span>
      </div>

      <div className="post-detail-layout">
        {/* ── Left: main info ── */}
        <div className="post-detail-main">
          <div className="post-detail-cover">
            <img src={post.thumbnailUrl} alt={post.tieuDe} />
          </div>

          <div className="post-detail-card">
            <p className="post-detail-card__eyebrow">Thông tin bài đăng #{post.id}</p>
            <h1 className="post-detail-card__title">{post.tieuDe}</h1>
            <div className="post-detail-card__price">{formatCurrency(post.gia)}</div>
            <div className="post-detail-card__meta">
              {post.dienTich} m² &bull; {post.phongNgu} phòng ngủ &bull; {post.danhMuc}
            </div>
          </div>

          <div className="post-detail-card">
            <h2 className="post-detail-section-title">Thông tin người đăng</h2>
            <div className="post-detail-info-grid">
              <div className="post-detail-info-item">
                <span>Người cho thuê</span>
                <strong>{post.hoVaTenNguoiChoThue}</strong>
              </div>
              <div className="post-detail-info-item">
                <span>Liên hệ</span>
                <strong>{post.soDienThoai}</strong>
              </div>
              <div className="post-detail-info-item">
                <span>Email</span>
                <strong>{post.email}</strong>
              </div>
              <div className="post-detail-info-item">
                <span>Phương thức thanh toán</span>
                <strong>{post.phuongThucThanhToan}</strong>
              </div>
              <div className="post-detail-info-item post-detail-info-item--full">
                <span>Địa chỉ</span>
                <strong>{post.diaChiCuThe}</strong>
              </div>
              <div className="post-detail-info-item">
                <span>Phường / Xã</span>
                <strong>{post.phuong}</strong>
              </div>
              <div className="post-detail-info-item">
                <span>Ngày đăng</span>
                <strong>{formatDate(post.ngayDang)}</strong>
              </div>
            </div>
          </div>

          {!!post.tienIch?.length && (
            <div className="post-detail-card">
              <h2 className="post-detail-section-title">Tiện ích</h2>
              <div className="post-detail-chip-list">
                {post.tienIch.map((item: string) => (
                  <span key={item} className="post-detail-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {post.lyDo && (
            <div className="post-detail-card">
              <h2 className="post-detail-section-title">Lý do từ chối gần nhất</h2>
              <div className="post-detail-note post-detail-note--danger">{post.lyDo}</div>
            </div>
          )}
        </div>

        {/* ── Right: actions sidebar ── */}
        <aside className="post-detail-sidebar">
          <div className="post-detail-card post-detail-card--sticky">
            <p className="post-detail-card__eyebrow">Thao tác duyệt bài</p>
            <h3 className="post-detail-sidebar__id">#{post.id}</h3>
            <span className={`post-detail-badge post-detail-badge--lg ${badge.className}`}>
              {badge.text}
            </span>

            <div className="post-detail-action-list">
              <button type="button" className="post-detail-btn post-detail-btn--success">
                ✓ Duyệt bài
              </button>
              <button type="button" className="post-detail-btn post-detail-btn--danger">
                ✕ Từ chối bài
              </button>
              <button type="button" className="post-detail-btn post-detail-btn--secondary">
                Yêu cầu bổ sung
              </button>
            </div>

            <div className="post-detail-meta-summary">
              <div className="post-detail-meta-row">
                <span>Giá thuê</span>
                <strong>{formatCurrency(post.gia)}</strong>
              </div>
              <div className="post-detail-meta-row">
                <span>Diện tích</span>
                <strong>{post.dienTich} m²</strong>
              </div>
              <div className="post-detail-meta-row">
                <span>Phòng ngủ</span>
                <strong>{post.phongNgu} PN</strong>
              </div>
              <div className="post-detail-meta-row">
                <span>Danh mục</span>
                <strong>{post.danhMuc}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostApprovalDetail;