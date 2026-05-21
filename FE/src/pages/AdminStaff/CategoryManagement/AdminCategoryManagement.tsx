import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type DanhMucDTO,
} from '../../../services/api/CategoryService';
import { getApiErrorMessage } from '../../../services/api/apiError';
import AdminPagination from '../components/AdminPagination';
import '../admin-management.css';

const emptyForm: DanhMucDTO = {
  tenDanhMuc: '',
};

const DEFAULT_PAGE_SIZE = 10;

const AdminCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<DanhMucDTO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DanhMucDTO | null>(null);
  const [form, setForm] = useState<DanhMucDTO>(emptyForm);

  const loadCategories = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return categories;

    return categories.filter((item) =>
      [item.maDanhMuc, item.tenDanhMuc].join(' ').toLowerCase().includes(normalizedKeyword),
    );
  }, [categories, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredCategories.length / pageSize));

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, filteredCategories.length, pageSize]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredCategories, pageSize]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item: DanhMucDTO) => {
    setEditingItem(item);
    setForm(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const tenDanhMuc = form.tenDanhMuc.trim();

    if (!tenDanhMuc) {
      message.warning('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSaving(true);

      if (editingItem?.maDanhMuc) {
        await updateCategory(editingItem.maDanhMuc, { ...form, tenDanhMuc });
        message.success('Cập nhật danh mục thành công');
      } else {
        await createCategory({ ...form, tenDanhMuc });
        message.success('Tạo danh mục thành công');
      }

      closeModal();
      await loadCategories();
    } catch (error) {
      console.error(error);
      message.error('Lưu danh mục thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DanhMucDTO) => {
    const maDanhMuc = item.maDanhMuc;
    if (!maDanhMuc) return;

    try {
      setDeletingId(maDanhMuc);
      await deleteCategory(maDanhMuc);
      message.success('Xóa danh mục thành công');
      await loadCategories();
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(
        error,
        'Không thể xóa danh mục vì đang liên kết với bài đăng hoặc bảng khác.',
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
              id="category-keyword"
              aria-label="Tìm kiếm danh mục"
              className="admin-management-input admin-management-input--with-icon"
              placeholder="Tên hoặc mã danh mục"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>

        <div className="admin-management-actions">
          <button type="button" className="admin-management-btn" onClick={loadCategories}>
            <ReloadOutlined />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            className="admin-management-btn admin-management-btn--primary"
            onClick={openCreateModal}
          >
            <PlusOutlined />
            Thêm danh mục
          </button>
        </div>
      </section>

      <section className="admin-management-panel">
        <div className="admin-management-panel__head">
          <div>
            <h2>Quản lý danh mục</h2>
            <p>{filteredCategories.length} danh mục phù hợp</p>
          </div>
        </div>

        <div className="admin-management-table-wrap">
          <table className="admin-management-table admin-management-table--category">
            <colgroup>
              <col className="admin-management-col-code" />
              <col className="admin-management-col-name" />
              <col className="admin-management-col-status" />
              <col className="admin-management-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên danh mục</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((item) => (
                <tr key={item.maDanhMuc || item.tenDanhMuc}>
                  <td className="admin-management-primary" title={item.maDanhMuc || '--'}>
                    {item.maDanhMuc || '--'}
                  </td>
                  <td title={item.tenDanhMuc}>{item.tenDanhMuc}</td>
                  <td>
                    <span className="admin-management-badge active">Đang dùng</span>
                  </td>
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
                        disabled={deletingId === item.maDanhMuc}
                        onClick={() => void handleDelete(item)}
                      >
                        <DeleteOutlined />
                        {deletingId === item.maDanhMuc ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredCategories.length && (
                <tr>
                  <td colSpan={4}>
                    <div className="admin-management-empty">Không có danh mục phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredCategories.length > 0 && (
          <AdminPagination
            current={currentPage}
            itemLabel="danh mục"
            pageSize={pageSize}
            total={filteredCategories.length}
            onChange={handlePageChange}
          />
        )}
      </section>

      <Modal
        title={editingItem ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={saving ? 'Đang lưu...' : 'Lưu'}
        cancelText="Hủy"
        confirmLoading={saving}
      >
        <div className="admin-management-form-grid">
          <div className="admin-management-form-field admin-management-form-field--full">
            <label htmlFor="category-name">Tên danh mục</label>
            <input
              id="category-name"
              value={form.tenDanhMuc}
              onChange={(event) => setForm((current) => ({
                ...current,
                tenDanhMuc: event.target.value,
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategoryManagement;
