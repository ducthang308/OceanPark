import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPosts } from '../../../services/mock/adminStaff.mock';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import './admin-post-approval.css';

const statusLabelMap: Record<string, { text: string; className: string }> = {
  CHO_DUYET: { text: 'Chờ duyệt', className: 'pending' },
  DA_DUYET: { text: 'Đã duyệt', className: 'approved' },
  TU_CHOI: { text: 'Từ chối', className: 'rejected' },
};

const AdminPostApproval: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');

  const filteredPosts = useMemo(() => {
    return adminPosts.filter((item) => {
      const searchText = [
        item.tieuDe,
        item.hoVaTenNguoiChoThue,
        item.phuong,
        item.diaChiCuThe,
        item.soDienThoai,
      ]
        .join(' ')
        .toLowerCase();

      const matchKeyword = searchText.includes(keyword.trim().toLowerCase());
      const matchStatus = status === 'ALL' ? true : item.trangThai === status;

      return matchKeyword && matchStatus;
    });
  }, [keyword, status]);

  const totalPosts = adminPosts.length;
  const pendingPosts = adminPosts.filter((item) => item.trangThai === 'CHO_DUYET').length;
  const approvedPosts = adminPosts.filter((item) => item.trangThai === 'DA_DUYET').length;
  const rejectedPosts = adminPosts.filter((item) => item.trangThai === 'TU_CHOI').length;

  const handleViewDetail = (id: number) => {
    navigate(`/admin/post-approval/${id}`);
  };

  return (
    <div className="post-approval-page">
      <section className="post-approval-filter-card">
        <div className="post-approval-filter-card__left">
          <div className="post-approval-field post-approval-field--search">
            <label htmlFor="keyword">Tìm kiếm bài đăng</label>
            <input
              id="keyword"
              className="post-approval-input"
              placeholder="Tìm theo tiêu đề, người đăng, số điện thoại, khu vực..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="post-approval-field post-approval-field--select">
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              className="post-approval-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHO_DUYET">Chờ duyệt</option>
              <option value="DA_DUYET">Đã duyệt</option>
              <option value="TU_CHOI">Từ chối</option>
            </select>
          </div>
        </div>

        <div className="post-approval-filter-card__right">
          <button type="button" className="post-approval-btn post-approval-btn--secondary">
            Xuất danh sách
          </button>
          <button type="button" className="post-approval-btn post-approval-btn--primary">
            Tạo rule duyệt
          </button>
        </div>
      </section>

      <section className="post-approval-stats">
        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Tổng bài đăng</span>
          <strong className="post-approval-stat-card__value">{totalPosts}</strong>
          <small className="post-approval-stat-card__sub">Toàn bộ dữ liệu mock</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Chờ duyệt</span>
          <strong className="post-approval-stat-card__value">{pendingPosts}</strong>
          <small className="post-approval-stat-card__sub">Cần xử lý sớm</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Đã duyệt</span>
          <strong className="post-approval-stat-card__value">{approvedPosts}</strong>
          <small className="post-approval-stat-card__sub">Đang hiển thị</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Bị từ chối</span>
          <strong className="post-approval-stat-card__value">{rejectedPosts}</strong>
          <small className="post-approval-stat-card__sub">Cần xem lại chất lượng</small>
        </article>
      </section>

      <section className="post-approval-table-card">
        <div className="post-approval-table-card__header">
          <div>
            <h2>Danh sách bài đăng</h2>
            <p>{filteredPosts.length} kết quả phù hợp</p>
          </div>
        </div>

        <div className="post-approval-table-wrap">
          <table className="post-approval-table">
            <thead>
              <tr>
                <th>Bài đăng</th>
                <th>Giá / Diện tích</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((item) => {
                  const badge = statusLabelMap[item.trangThai];

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleViewDetail(item.id)}
                    >
                      <td>
                        <div className="post-approval-post-cell">
                          <img
                            className="post-approval-post-cell__thumb"
                            src={item.thumbnailUrl}
                            alt={item.tieuDe}
                          />
                          <div className="post-approval-post-cell__body">
                            <div className="post-approval-post-cell__title">{item.tieuDe}</div>
                            <div className="post-approval-post-cell__meta">
                              {item.hoVaTenNguoiChoThue} • {item.soDienThoai}
                            </div>
                            <div className="post-approval-post-cell__meta">
                              {item.phuong} • {item.diaChiCuThe}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="post-approval-price">
                          <strong>{formatCurrency(item.gia)}</strong>
                          <span>
                            {item.dienTich} m² • {item.phongNgu} PN
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="post-approval-date">{formatDate(item.ngayDang)}</span>
                      </td>

                      <td>
                        <span className={`post-approval-badge ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="post-approval-actions">
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--light"
                            onClick={() => handleViewDetail(item.id)}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--success"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--danger"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="post-approval-empty">
                      <h3>Không có bài đăng phù hợp</h3>
                      <p>Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPostApproval;