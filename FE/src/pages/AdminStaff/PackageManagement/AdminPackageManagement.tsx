import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  createPackage,
  deletePackage,
  getPackages,
  updatePackage,
  type GoiDangBaiDTO,
} from '../../../services/api/PackageManagementService';
import { getApiErrorMessage } from '../../../services/api/apiError';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import AdminPagination from '../components/AdminPagination';
import '../admin-management.css';

interface PackageForm {
  tenGoi: string;
  giaTien: string;
  thoiHanNgay: string;
  trangThai: string;
}

const emptyForm: PackageForm = {
  tenGoi: '',
  giaTien: '',
  thoiHanNgay: '30',
  trangThai: 'ACTIVE',
};

const DEFAULT_PAGE_SIZE = 10;

const getBadgeClass = (status?: string | null) => {
  const normalizedStatus = (status || '').toUpperCase();
  if (normalizedStatus === 'ACTIVE') return 'active';
  if (normalizedStatus === 'PENDING') return 'pending';
  return 'inactive';
};

const isUsablePackage = (status?: string | null) => (status || '').toUpperCase() === 'ACTIVE';

const AdminPackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<GoiDangBaiDTO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoiDangBaiDTO | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);

  const loadPackages = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getPackages();
      setPackages(data);
    } catch (error) {
      console.error(error);
      message.error('Không tải được gói bài đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  const filteredPackages = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return packages.filter((item) => {
      const itemStatus = (item.trangThai || '').toUpperCase();
      const searchText = [
        item.maGoiDangBai,
        item.tenGoi,
        item.maNguoiDung,
        item.hoVaTenNguoiDung,
      ]
        .join(' ')
        .toLowerCase();

      return (
        searchText.includes(normalizedKeyword) &&
        (status === 'ALL' ? true : itemStatus === status)
      );
    });
  }, [keyword, packages, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, status]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredPackages.length / pageSize));

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, filteredPackages.length, pageSize]);

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPackages.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredPackages, pageSize]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item: GoiDangBaiDTO) => {
    setEditingItem(item);
    setForm({
      tenGoi: item.tenGoi || '',
      giaTien: String(item.giaTien ?? ''),
      thoiHanNgay: String(item.thoiHanNgay ?? 30),
      trangThai: item.trangThai || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const buildPayload = (): GoiDangBaiDTO | null => {
    const tenGoi = form.tenGoi.trim();
    const giaTien = Number(form.giaTien);
    const thoiHanNgay = Number(form.thoiHanNgay);

    if (!tenGoi) {
      message.warning('Vui lòng nhập tên gói');
      return null;
    }

    if (Number.isNaN(giaTien) || giaTien < 0) {
      message.warning('Giá tiền không hợp lệ');
      return null;
    }

    if (Number.isNaN(thoiHanNgay) || thoiHanNgay <= 0) {
      message.warning('Thời hạn phải lớn hơn 0');
      return null;
    }

    return {
      maGoiDangBai: editingItem?.maGoiDangBai,
      tenGoi,
      giaTien,
      thoiHanNgay,
      trangThai: form.trangThai,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);

      if (editingItem?.maGoiDangBai) {
        await updatePackage(editingItem.maGoiDangBai, payload);
        message.success('Cập nhật gói bài đăng thành công');
      } else {
        await createPackage(payload);
        message.success('Tạo gói bài đăng thành công');
      }

      closeModal();
      await loadPackages();
    } catch (error) {
      console.error(error);
      message.error('Lưu gói bài đăng thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: GoiDangBaiDTO) => {
    const maGoiDangBai = item.maGoiDangBai;
    if (!maGoiDangBai) return;

    if (isUsablePackage(item.trangThai)) {
      message.warning('Không thể xóa gói còn dùng được. Vui lòng chuyển trạng thái sang INACTIVE trước.');
      return;
    }

    try {
      setDeletingId(maGoiDangBai);
      await deletePackage(maGoiDangBai);
      message.success('Xóa gói bài đăng thành công');
      await loadPackages();
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(
        error,
        'Không thể xóa gói vì đang liên kết với hóa đơn, người dùng hoặc bảng khác.',
      ));
    } finally {
      setDeletingId('');
    }
  };

  const handlePageChange = (page: number, nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(nextPageSize === pageSize ? page : 1);
  };

  return (
    <div className="admin-management-page">
      <section className="admin-management-toolbar">
        <div className="admin-management-toolbar__left">
          <div className="admin-management-field">
            <SearchOutlined className="admin-management-field__icon" />
            <input
              id="package-keyword"
              aria-label="Tìm kiếm gói bài đăng"
              className="admin-management-input admin-management-input--with-icon"
              placeholder="Tên gói, mã gói, người dùng"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <div className="admin-management-field">
            <FilterOutlined className="admin-management-field__icon" />
            <select
              id="package-status"
              aria-label="Lọc trạng thái gói"
              className="admin-management-select admin-management-select--with-icon"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="admin-management-actions">
          <button type="button" className="admin-management-btn" onClick={loadPackages}>
            <ReloadOutlined />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            className="admin-management-btn admin-management-btn--primary"
            onClick={openCreateModal}
          >
            <PlusOutlined />
            Thêm gói
          </button>
        </div>
      </section>

      <section className="admin-management-panel">
        <div className="admin-management-panel__head">
          <div>
            <h2>Quản lý gói bài đăng</h2>
            <p>{filteredPackages.length} gói phù hợp</p>
          </div>
        </div>

        <div className="admin-management-table-wrap">
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>Mã gói</th>
                <th>Tên gói</th>
                <th>Giá</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPackages.map((item) => (
                <tr key={item.maGoiDangBai || item.tenGoi}>
                  <td className="admin-management-primary" title={item.maGoiDangBai || '--'}>
                    {item.maGoiDangBai || '--'}
                  </td>
                  <td>
                    <div className="admin-management-primary" title={item.tenGoi}>
                      {item.tenGoi}
                    </div>
                    <div
                      className="admin-management-muted"
                      title={item.hoVaTenNguoiDung || item.maNguoiDung || 'Gói cấu hình'}
                    >
                      {item.hoVaTenNguoiDung || item.maNguoiDung || 'Gói cấu hình'}
                    </div>
                  </td>
                  <td>{formatCurrency(item.giaTien)}</td>
                  <td>{item.thoiHanNgay ? `${item.thoiHanNgay} ngày` : '--'}</td>
                  <td>
                    <span className={`admin-management-badge ${getBadgeClass(item.trangThai)}`}>
                      {item.trangThai || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>{formatDate(item.ngayTao || undefined)}</td>
                  <td>
                    <div className="admin-management-actions">
                      <button
                        type="button"
                        className="admin-management-btn"
                        onClick={() => openEditModal(item)}
                      >
                        <EditOutlined />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="admin-management-btn admin-management-btn--danger"
                        disabled={deletingId === item.maGoiDangBai}
                        onClick={() => void handleDelete(item)}
                      >
                        <DeleteOutlined />
                        {deletingId === item.maGoiDangBai ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredPackages.length && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-management-empty">Không có gói bài đăng phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPackages.length > 0 && (
          <AdminPagination
            current={currentPage}
            itemLabel="gói"
            pageSize={pageSize}
            total={filteredPackages.length}
            onChange={handlePageChange}
          />
        )}
      </section>

      <Modal
        title={editingItem ? 'Cập nhật gói bài đăng' : 'Thêm gói bài đăng'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={saving ? 'Đang lưu...' : 'Lưu'}
        cancelText="Hủy"
        confirmLoading={saving}
      >
        <div className="admin-management-form-grid">
          <div className="admin-management-form-field admin-management-form-field--full">
            <label htmlFor="package-name">Tên gói</label>
            <input
              id="package-name"
              value={form.tenGoi}
              onChange={(event) => setForm((current) => ({
                ...current,
                tenGoi: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="package-price">Giá tiền</label>
            <input
              id="package-price"
              value={form.giaTien}
              onChange={(event) => setForm((current) => ({
                ...current,
                giaTien: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="package-duration">Thời hạn ngày</label>
            <input
              id="package-duration"
              value={form.thoiHanNgay}
              onChange={(event) => setForm((current) => ({
                ...current,
                thoiHanNgay: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="package-status-form">Trạng thái</label>
            <select
              id="package-status-form"
              value={form.trangThai}
              onChange={(event) => setForm((current) => ({
                ...current,
                trangThai: event.target.value,
              }))}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default AdminPackageManagement;
