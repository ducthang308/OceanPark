import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  IdcardOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  approvePost,
  getAdminPosts,
  rejectPost,
} from '../../../services/api/AdminPostService';
import { getCategories } from '../../../services/api/CategoryService';
import { getApiErrorMessage } from '../../../services/api/apiError';
import type { BaiDangDTO } from '../../../services/api/PostManagementService';
import { formatDate } from '../../../utils/date';
import AdminPagination from '../components/AdminPagination';
import './admin-post-approval.css';

const statusLabelMap: Record<string, { text: string; className: string }> = {
  PENDING: { text: 'Chờ duyệt', className: 'pending' },
  CHO_DUYET: { text: 'Chờ duyệt', className: 'pending' },
  APPROVED: { text: 'Đã duyệt', className: 'approved' },
  DA_DUYET: { text: 'Đã duyệt', className: 'approved' },
  ACTIVE: { text: 'Đang hiển thị', className: 'approved' },
  REJECTED: { text: 'Từ chối', className: 'rejected' },
  TU_CHOI: { text: 'Từ chối', className: 'rejected' },
  INACTIVE: { text: 'Đã ẩn', className: 'rejected' },
};

const normalizePostStatus = (status?: string) => (status || '').toUpperCase();

const getStatusBadge = (status?: string) =>
  statusLabelMap[normalizePostStatus(status)] ?? {
    text: status || 'Không xác định',
    className: 'pending',
  };

const isVisiblePostStatus = (status?: string) =>
  ['APPROVED', 'ACTIVE', 'DA_DUYET'].includes(normalizePostStatus(status));

const isPendingPostStatus = (status?: string) =>
  ['PENDING', 'CHO_DUYET'].includes(normalizePostStatus(status));

const isRejectedPostStatus = (status?: string) =>
  ['REJECTED', 'TU_CHOI'].includes(normalizePostStatus(status));

const DEFAULT_PAGE_SIZE = 10;

const AdminPostApproval: React.FC = () => {
  const [posts, setPosts] = useState<BaiDangDTO[]>([]);
  const [categoryNameById, setCategoryNameById] = useState<Record<string, string>>({});
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState('');
  const [selectedPost, setSelectedPost] = useState<BaiDangDTO | null>(null);
  const [rejectTargetPost, setRejectTargetPost] = useState<BaiDangDTO | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);

    try {
      const [postResult, categoryResult] = await Promise.allSettled([
        getAdminPosts(),
        getCategories(),
      ]);

      if (postResult.status === 'fulfilled') {
        setPosts(postResult.value);
      } else {
        console.error(postResult.reason);
        message.error('Không tải được danh sách bài đăng');
      }

      if (categoryResult.status === 'fulfilled') {
        const categoryMap = categoryResult.value.reduce<Record<string, string>>((result, item) => {
          if (item.maDanhMuc) {
            result[item.maDanhMuc] = item.tenDanhMuc;
          }

          return result;
        }, {});

        setCategoryNameById(categoryMap);
      } else {
        console.error(categoryResult.reason);
        message.warning('Không tải được tên danh mục, tạm hiển thị mã danh mục');
      }
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const getCategoryName = useCallback((maDanhMuc?: string) => {
    if (!maDanhMuc) return '--';
    return categoryNameById[maDanhMuc] || maDanhMuc;
  }, [categoryNameById]);

  const getUserName = useCallback((maNguoiDung?: string) => {
    if (!maNguoiDung) return '--';
    return categoryNameById[maNguoiDung] || maNguoiDung;
  }, [categoryNameById]);

  const replacePostInState = useCallback((updatedPost: BaiDangDTO) => {
    if (!updatedPost.maBaiDang) return;

    setPosts((currentPosts) =>
      currentPosts.map((item) =>
        item.maBaiDang === updatedPost.maBaiDang ? { ...item, ...updatedPost } : item,
      ),
    );

    setSelectedPost((currentPost) =>
      currentPost?.maBaiDang === updatedPost.maBaiDang
        ? { ...currentPost, ...updatedPost }
        : currentPost,
    );
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return posts.filter((item) => {
      const postStatus = (item.trangThai || '').toUpperCase();
      const searchText = [
        item.maBaiDang,
        item.tieuDe,
        item.maNguoiDung,
        item.maDanhMuc,
        getCategoryName(item.maDanhMuc),
        getUserName(item.maNguoiDung),
        item.lienHe,
        item.noiDung,
      ]
        .join(' ')
        .toLowerCase();

      const matchKeyword = searchText.includes(normalizedKeyword);
      const matchStatus =
        status === 'ALL'
          ? true
          : status === 'VISIBLE'
            ? isVisiblePostStatus(postStatus)
            : status === 'PENDING'
              ? isPendingPostStatus(postStatus)
              : status === 'REJECTED'
                ? isRejectedPostStatus(postStatus)
                : postStatus === status;

      return matchKeyword && matchStatus;
    });
  }, [getCategoryName, getUserName, keyword, posts, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, status]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredPosts.length / pageSize));

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, filteredPosts.length, pageSize]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPosts.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredPosts, pageSize]);

  const totalPosts = posts.length;
  const pendingPosts = posts.filter((item) => isPendingPostStatus(item.trangThai)).length;
  const approvedPosts = posts.filter((item) => isVisiblePostStatus(item.trangThai)).length;
  const rejectedPosts = posts.filter((item) => isRejectedPostStatus(item.trangThai)).length;

  const handleApprove = async (maBaiDang?: string) => {
    if (!maBaiDang) return;

    try {
      setProcessingId(maBaiDang);
      const updatedPost = await approvePost(maBaiDang);
      replacePostInState(updatedPost);
      message.success('Đã duyệt và hiển thị bài đăng');
      await loadPosts();
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(error, 'Duyệt bài đăng thất bại'));
    } finally {
      setProcessingId('');
    }
  };

  const openRejectConfirm = (post?: BaiDangDTO | null) => {
    if (!post?.maBaiDang) return;
    setSelectedPost(null);
    setRejectTargetPost(post);
  };

  const handleReject = async () => {
    const post = rejectTargetPost;
    const maBaiDang = post?.maBaiDang;
    if (!maBaiDang) return;

    try {
      setProcessingId(maBaiDang);
      const updatedPost = await rejectPost(maBaiDang);
      replacePostInState(updatedPost);
      setRejectTargetPost(null);
      message.success('Đã từ chối bài đăng');
      await loadPosts();
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(error, 'Từ chối bài đăng thất bại'));
    } finally {
      setProcessingId('');
    }
  };

  const handlePageChange = (page: number, nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(nextPageSize === pageSize ? page : 1);
  };

  const selectedBadge = selectedPost ? getStatusBadge(selectedPost.trangThai) : null;
  const isSelectedProcessing = selectedPost?.maBaiDang
    ? processingId === selectedPost.maBaiDang
    : false;

  return (
    <div className="post-approval-page">
      <section className="post-approval-filter-card">
        <div className="post-approval-filter-card__left">
          <div className="post-approval-field post-approval-field--search">
            <SearchOutlined className="post-approval-field__icon" />
            <input
              id="keyword"
              aria-label="Tìm kiếm bài đăng"
              className="post-approval-input post-approval-input--with-icon"
              placeholder="Mã bài, tiêu đề, người đăng, danh mục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="post-approval-field post-approval-field--select">
            <FilterOutlined className="post-approval-field__icon" />
            <select
              id="status"
              aria-label="Lọc trạng thái"
              className="post-approval-select post-approval-select--with-icon"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="VISIBLE">Đã duyệt / đang hiển thị</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>

        <div className="post-approval-filter-card__right">
          <button
            type="button"
            className="post-approval-btn post-approval-btn--secondary"
            onClick={loadPosts}
            disabled={loading}
          >
            <ReloadOutlined />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </section>

      <section className="post-approval-stats">
        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Tổng bài đăng</span>
          <strong className="post-approval-stat-card__value">{totalPosts}</strong>
          <small className="post-approval-stat-card__sub">Toàn hệ thống</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Chờ duyệt</span>
          <strong className="post-approval-stat-card__value">{pendingPosts}</strong>
          <small className="post-approval-stat-card__sub">Cần xử lý</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Đã duyệt</span>
          <strong className="post-approval-stat-card__value">{approvedPosts}</strong>
          <small className="post-approval-stat-card__sub">Sẵn sàng hiển thị</small>
        </article>

        <article className="post-approval-stat-card">
          <span className="post-approval-stat-card__label">Bị từ chối</span>
          <strong className="post-approval-stat-card__value">{rejectedPosts}</strong>
          <small className="post-approval-stat-card__sub">Không đạt yêu cầu</small>
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
            <colgroup>
              <col className="post-approval-col-post" />
              <col className="post-approval-col-user" />
              <col className="post-approval-col-category" />
              <col className="post-approval-col-date" />
              <col className="post-approval-col-status" />
              <col className="post-approval-col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Bài đăng</th>
                <th>Người đăng</th>
                <th>Danh mục</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.length > 0 ? (
                paginatedPosts.map((item) => {
                  const badge = getStatusBadge(item.trangThai);
                  const isProcessing = processingId === item.maBaiDang;
                  const isVisible = isVisiblePostStatus(item.trangThai);
                  const isRejected = isRejectedPostStatus(item.trangThai);

                  return (
                    <tr key={item.maBaiDang}>
                      <td>
                        <div className="post-approval-post-cell">
                          <div className="post-approval-post-cell__body">
                            <div className="post-approval-post-cell__title">
                              {item.tieuDe || 'Không có tiêu đề'}
                            </div>
                            <div className="post-approval-post-cell__meta">
                              {item.maBaiDang} • {item.lienHe || 'Chưa có liên hệ'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="post-approval-user">
                          {getUserName(item.maNguoiDung)}
                        </span>
                      </td>
                      <td>
                        <span className="post-approval-category">
                          {getCategoryName(item.maDanhMuc)}
                        </span>
                      </td>
                      <td>
                        <span className="post-approval-date">{formatDate(item.ngayDang)}</span>
                      </td>
                      <td>
                        <span className={`post-approval-badge ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td>
                        <div className="post-approval-actions">
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--light"
                            onClick={() => setSelectedPost(item)}
                            aria-label="Xem chi tiết"
                            title="Xem chi tiết"
                          >
                            <EyeOutlined />
                          </button>
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--success"
                            disabled={isProcessing || isVisible}
                            onClick={() => handleApprove(item.maBaiDang)}
                            aria-label="Duyệt bài"
                            title="Duyệt bài"
                          >
                            <CheckOutlined />
                          </button>
                          <button
                            type="button"
                            className="post-approval-btn post-approval-btn--row post-approval-btn--danger"
                            disabled={isProcessing || isRejected}
                            onClick={() => openRejectConfirm(item)}
                            aria-label="Từ chối bài"
                            title="Từ chối bài"
                          >
                            <CloseOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
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

        {filteredPosts.length > 0 && (
          <AdminPagination
            current={currentPage}
            itemLabel="bài đăng"
            pageSize={pageSize}
            total={filteredPosts.length}
            onChange={handlePageChange}
          />
        )}
      </section>

      <Modal
        className="post-approval-detail-modal"
        width={760}
        centered
        open={!!selectedPost}
        onCancel={() => setSelectedPost(null)}
        footer={null}
      >
        {selectedPost && selectedBadge && (
          <div className="post-detail">
            <div className="post-detail__hero">
              <div className="post-detail__hero-main">
                <span className="post-detail__eyebrow">Chi tiết bài đăng</span>
                <h2>{selectedPost.tieuDe || 'Không có tiêu đề'}</h2>
                <p>
                  {selectedPost.maBaiDang || '--'} • {formatDate(selectedPost.ngayDang)}
                </p>
              </div>

              <span className={`post-approval-badge ${selectedBadge.className}`}>
                {selectedBadge.text}
              </span>
            </div>

            <div className="post-detail__grid">
              <div className="post-detail__item">
                <IdcardOutlined />
                <span>Mã bài</span>
                <strong>{selectedPost.maBaiDang || '--'}</strong>
              </div>

              <div className="post-detail__item">
                <UserOutlined />
                <span>Người đăng</span>
                <strong>{selectedPost.maNguoiDung || '--'}</strong>
              </div>

              <div className="post-detail__item">
                <TagsOutlined />
                <span>Danh mục</span>
                <strong>{getCategoryName(selectedPost.maDanhMuc)}</strong>
              </div>

              <div className="post-detail__item">
                <PhoneOutlined />
                <span>Liên hệ</span>
                <strong>{selectedPost.lienHe || '--'}</strong>
              </div>

              <div className="post-detail__item post-detail__item--wide">
                <CalendarOutlined />
                <span>Ngày đăng</span>
                <strong>{formatDate(selectedPost.ngayDang)}</strong>
              </div>
            </div>

            <div className="post-detail__content">
              <div className="post-detail__section-title">
                <FileTextOutlined />
                <span>Nội dung bài đăng</span>
              </div>
              <p>{selectedPost.noiDung || 'Chưa có nội dung'}</p>
            </div>

            <div className="post-detail__footer">
              <button
                type="button"
                className="post-approval-btn post-approval-btn--light"
                onClick={() => setSelectedPost(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="post-approval-btn post-approval-btn--success"
                disabled={isSelectedProcessing || isVisiblePostStatus(selectedPost.trangThai)}
                onClick={() => handleApprove(selectedPost.maBaiDang)}
              >
                <CheckOutlined />
                Duyệt bài
              </button>
              <button
                type="button"
                className="post-approval-btn post-approval-btn--danger"
                disabled={isSelectedProcessing || isRejectedPostStatus(selectedPost.trangThai)}
                onClick={() => openRejectConfirm(selectedPost)}
              >
                <CloseOutlined />
                Từ chối
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Từ chối bài đăng?"
        centered
        open={!!rejectTargetPost}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        confirmLoading={
          !!rejectTargetPost?.maBaiDang && processingId === rejectTargetPost.maBaiDang
        }
        onOk={handleReject}
        onCancel={() => {
          if (!processingId) setRejectTargetPost(null);
        }}
      >
        <p>
          Bài đăng "{rejectTargetPost?.tieuDe || rejectTargetPost?.maBaiDang}" sẽ chuyển
          sang trạng thái từ chối.
        </p>
      </Modal>
    </div>
  );
};

export default AdminPostApproval;
