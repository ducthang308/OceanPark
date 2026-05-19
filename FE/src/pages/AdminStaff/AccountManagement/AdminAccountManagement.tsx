import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  EditOutlined,
  FilterOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  changeUserStatus,
  createUserByAdmin,
  getAllUsers,
  updateUserByAdmin,
  type AdminUserDTO,
} from '../../../services/api/AdminAccountService';
import AdminPagination from '../components/AdminPagination';
import '../admin-management.css';

interface AccountForm {
  hoVaTen: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
  maVaiTro: string;
  trangThai: string;
  matKhau: string;
}

const emptyForm: AccountForm = {
  hoVaTen: '',
  soDienThoai: '',
  email: '',
  diaChi: '',
  maVaiTro: '2',
  trangThai: 'true',
  matKhau: '',
};

const roleLabelMap: Record<string, string> = {
  '1': 'Admin',
  '2': 'Người thuê',
  '3': 'Người cho thuê',
};

const DEFAULT_PAGE_SIZE = 10;

const AdminAccountManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDTO | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return users.filter((item) => {
      const searchText = [
        item.maNguoiDung,
        item.hoVaTen,
        item.soDienThoai,
        item.email,
        item.diaChi,
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedKeyword) && (role === 'ALL' ? true : item.maVaiTro === role);
    });
  }, [keyword, role, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, role]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, filteredUsers.length, pageSize]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredUsers, pageSize]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item: AdminUserDTO) => {
    setEditingUser(item);
    setForm({
      hoVaTen: item.hoVaTen || '',
      soDienThoai: item.soDienThoai || '',
      email: item.email || '',
      diaChi: item.diaChi || '',
      maVaiTro: item.maVaiTro || '2',
      trangThai: String(item.trangThai ?? true),
      matKhau: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const buildPayload = (): AdminUserDTO | null => {
    const hoVaTen = form.hoVaTen.trim();
    const soDienThoai = form.soDienThoai.trim();

    if (!hoVaTen) {
      message.warning('Vui lòng nhập họ tên');
      return null;
    }

    if (!soDienThoai) {
      message.warning('Vui lòng nhập số điện thoại');
      return null;
    }

    if (!editingUser && !form.matKhau.trim()) {
      message.warning('Vui lòng nhập mật khẩu cho tài khoản mới');
      return null;
    }

    return {
      maNguoiDung: editingUser?.maNguoiDung,
      hoVaTen,
      soDienThoai,
      email: form.email.trim() || null,
      diaChi: form.diaChi.trim() || null,
      maVaiTro: form.maVaiTro,
      trangThai: form.trangThai === 'true',
      ...(form.matKhau.trim() ? { matKhau: form.matKhau.trim() } : {}),
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);

      if (editingUser?.maNguoiDung) {
        await updateUserByAdmin(editingUser.maNguoiDung, payload);
        message.success('Cập nhật tài khoản thành công');
      } else {
        await createUserByAdmin(payload);
        message.success('Tạo tài khoản thành công');
      }

      closeModal();
      await loadUsers();
    } catch (error) {
      console.error(error);
      message.error('Lưu tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: AdminUserDTO) => {
    if (!item.maNguoiDung) return;

    try {
      setProcessingId(item.maNguoiDung);
      await changeUserStatus(item.maNguoiDung, !item.trangThai);
      message.success('Cập nhật trạng thái tài khoản thành công');
      await loadUsers();
    } catch (error) {
      console.error(error);
      message.error('Cập nhật trạng thái thất bại');
    } finally {
      setProcessingId('');
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
              id="account-keyword"
              aria-label="Tìm kiếm tài khoản"
              className="admin-management-input admin-management-input--with-icon"
              placeholder="Tên, số điện thoại, email"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <div className="admin-management-field">
            <FilterOutlined className="admin-management-field__icon" />
            <select
              id="account-role"
              aria-label="Lọc vai trò"
              className="admin-management-select admin-management-select--with-icon"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="1">Admin</option>
              <option value="2">Người thuê</option>
              <option value="3">Người cho thuê</option>
            </select>
          </div>
        </div>

        <div className="admin-management-actions">
          <button type="button" className="admin-management-btn" onClick={loadUsers}>
            <ReloadOutlined />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            className="admin-management-btn admin-management-btn--primary"
            onClick={openCreateModal}
          >
            <PlusOutlined />
            Thêm tài khoản
          </button>
        </div>
      </section>

      <section className="admin-management-panel">
        <div className="admin-management-panel__head">
          <div>
            <h2>Quản lý tài khoản</h2>
            <p>{filteredUsers.length} tài khoản phù hợp</p>
          </div>
        </div>

        <div className="admin-management-table-wrap">
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((item) => (
                <tr key={item.maNguoiDung || item.soDienThoai}>
                  <td className="admin-management-primary" title={item.maNguoiDung || '--'}>
                    {item.maNguoiDung || '--'}
                  </td>
                  <td>
                    <div className="admin-management-primary" title={item.hoVaTen}>
                      {item.hoVaTen}
                    </div>
                    <div className="admin-management-muted" title={item.diaChi || 'Chưa có địa chỉ'}>
                      {item.diaChi || 'Chưa có địa chỉ'}
                    </div>
                  </td>
                  <td>
                    <div title={item.soDienThoai}>{item.soDienThoai}</div>
                    <div className="admin-management-muted" title={item.email || 'Chưa có email'}>
                      {item.email || 'Chưa có email'}
                    </div>
                  </td>
                  <td>{roleLabelMap[item.maVaiTro || ''] || item.maVaiTro || '--'}</td>
                  <td>
                    <span className={`admin-management-badge ${item.trangThai === false ? 'inactive' : 'active'}`}>
                      {item.trangThai === false ? 'Đã khóa' : 'Hoạt động'}
                    </span>
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
                        className={`admin-management-btn ${
                          item.trangThai === false
                            ? 'admin-management-btn--success'
                            : 'admin-management-btn--danger'
                        }`}
                        disabled={processingId === item.maNguoiDung}
                        onClick={() => handleToggleStatus(item)}
                      >
                        {item.trangThai === false ? <UnlockOutlined /> : <LockOutlined />}
                        {item.trangThai === false ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredUsers.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-management-empty">Không có tài khoản phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
          <AdminPagination
            current={currentPage}
            itemLabel="tài khoản"
            pageSize={pageSize}
            total={filteredUsers.length}
            onChange={handlePageChange}
          />
        )}
      </section>

      <Modal
        title={editingUser ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={saving ? 'Đang lưu...' : 'Lưu'}
        cancelText="Hủy"
        confirmLoading={saving}
        width={720}
      >
        <div className="admin-management-form-grid">
          <div className="admin-management-form-field">
            <label htmlFor="account-name">Họ tên</label>
            <input
              id="account-name"
              value={form.hoVaTen}
              onChange={(event) => setForm((current) => ({
                ...current,
                hoVaTen: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="account-phone">Số điện thoại</label>
            <input
              id="account-phone"
              value={form.soDienThoai}
              onChange={(event) => setForm((current) => ({
                ...current,
                soDienThoai: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="account-email">Email</label>
            <input
              id="account-email"
              value={form.email}
              onChange={(event) => setForm((current) => ({
                ...current,
                email: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="account-password">Mật khẩu</label>
            <input
              id="account-password"
              type="password"
              placeholder={editingUser ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
              value={form.matKhau}
              onChange={(event) => setForm((current) => ({
                ...current,
                matKhau: event.target.value,
              }))}
            />
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="account-role-form">Vai trò</label>
            <select
              id="account-role-form"
              value={form.maVaiTro}
              onChange={(event) => setForm((current) => ({
                ...current,
                maVaiTro: event.target.value,
              }))}
            >
              <option value="1">Admin</option>
              <option value="2">Người thuê</option>
              <option value="3">Người cho thuê</option>
            </select>
          </div>

          <div className="admin-management-form-field">
            <label htmlFor="account-status-form">Trạng thái</label>
            <select
              id="account-status-form"
              value={form.trangThai}
              onChange={(event) => setForm((current) => ({
                ...current,
                trangThai: event.target.value,
              }))}
            >
              <option value="true">Hoạt động</option>
              <option value="false">Đã khóa</option>
            </select>
          </div>

          <div className="admin-management-form-field admin-management-form-field--full">
            <label htmlFor="account-address">Địa chỉ</label>
            <input
              id="account-address"
              value={form.diaChi}
              onChange={(event) => setForm((current) => ({
                ...current,
                diaChi: event.target.value,
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAccountManagement;
