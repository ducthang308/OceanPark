import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import axios from 'axios';
import { message } from 'antd';
import './AccountManagement.css';
import Navbar from '../../components/layout/Navbar/navbar';
import {
  changePassword,
  changePhoneNumber,
  getCurrentUser,
  getUserById,
  updateUser,
  uploadUserAvatar,
  type UserProfileResponse,
} from '../../services/api/UserService';
import { ROLE_ID } from '../../constants/roles';
import {
  getPaymentAccountsByLandlord,
  upsertDefaultPaymentAccount,
  type PaymentAccountDTO,
} from '../../services/api/PaymentAccountService';
import type { PaymentAccountFormState } from './AccountManagement_paymentTypes';










type TabKey = 'profile' | 'phone' | 'password' | 'payment-account';


type ProfileFormState = {
  hoVaTen: string;
  email: string;
  diaChi: string;
};

type PasswordFormState = {
  newPassword: string;
  confirmPassword: string;
};

const emptyProfileForm: ProfileFormState = {
  hoVaTen: '',
  email: '',
  diaChi: '',
};

const emptyPasswordForm: PasswordFormState = {
  newPassword: '',
  confirmPassword: '',
};

const emptyPaymentAccountForm: PaymentAccountFormState = {
  bankCode: '',
  bankAccount: '',
  accountName: '',
};

const getStringValue = (value: unknown) => (typeof value === 'string' ? value : '');

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object' && 'message' in data) {
      const messageValue = (data as { message?: unknown }).message;
      if (typeof messageValue === 'string' && messageValue.trim()) return messageValue;
    }
  }

  return fallback;
};

const mergeUserProfile = (
  current: UserProfileResponse,
  next: Partial<UserProfileResponse>,
): UserProfileResponse => ({
  ...current,
  ...next,
  maNguoiDung: next.maNguoiDung ?? current.maNguoiDung,
  hoVaTen: next.hoVaTen ?? current.hoVaTen,
  soDienThoai: next.soDienThoai ?? current.soDienThoai,
  email: next.email ?? current.email,
  vaiTro: next.vaiTro ?? current.vaiTro,
  maVaiTro: next.maVaiTro ?? current.maVaiTro,
});

const syncStoredAccount = (account: UserProfileResponse) => {
  const rawUser = localStorage.getItem('user');
  let storedUser: Record<string, unknown> = {};

  if (rawUser) {
    try {
      storedUser = JSON.parse(rawUser) as Record<string, unknown>;
    } catch {
      storedUser = {};
    }
  }

  const nextEmail = account.email ?? getStringValue(storedUser.email);
  const nextRole = account.vaiTro ?? getStringValue(storedUser.vaiTro);
  const nextRoleId = account.maVaiTro ?? getStringValue(storedUser.maVaiTro);
  const nextUser = {
    ...storedUser,
    ...account,
    email: nextEmail,
    vaiTro: nextRole,
    maVaiTro: nextRoleId || undefined,
  };

  localStorage.setItem('user', JSON.stringify(nextUser));
  localStorage.setItem('userId', account.maNguoiDung);
  localStorage.setItem('hoVaTen', account.hoVaTen);
  localStorage.setItem('email', nextEmail);
  localStorage.setItem('vaiTro', nextRole);

  if (nextRoleId) {
    localStorage.setItem('maVaiTro', nextRoleId);
  }

  window.dispatchEvent(new Event('storage'));
};

const AccountManagement = () => {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [user, setUser] = useState<UserProfileResponse | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [newPhone, setNewPhone] = useState('');
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);

  const [paymentAccountForm, setPaymentAccountForm] =
    useState<PaymentAccountFormState>(emptyPaymentAccountForm);
  const [loadingPaymentAccount, setLoadingPaymentAccount] = useState(false);
  const [savingPaymentAccount, setSavingPaymentAccount] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  const isLandlord = user?.maVaiTro === ROLE_ID.NGUOI_CHO_THUE;

  const displayName = useMemo(() => user?.hoVaTen?.trim() || 'Tài khoản', [user]);
  const displayEmail = user?.email?.trim() || 'Chưa cập nhật';
  const displayPhone = user?.soDienThoai?.trim() || 'Chưa cập nhật';
  const displayRole = user?.vaiTro?.trim() || user?.maVaiTro?.trim() || 'Chưa cập nhật';
  const displayAddress = user?.diaChi?.trim() || 'Chưa cập nhật';

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const currentUser = await getCurrentUser();
      const currentProfile: UserProfileResponse = {
        ...currentUser,
        diaChi: null,
      };
      const detailUser = await getUserById(currentUser.maNguoiDung).catch(() => null);
      const nextUser = detailUser ? mergeUserProfile(currentProfile, detailUser) : currentProfile;

      setUser(nextUser);
      setProfileForm({
        hoVaTen: nextUser.hoVaTen ?? '',
        email: nextUser.email ?? '',
        diaChi: nextUser.diaChi ?? '',
      });
      setNewPhone('');
      setIsProfileFormOpen(false);
      syncStoredAccount(nextUser);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Không tải được thông tin tài khoản');
      setLoadError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const applyUpdatedUser = (updatedUser: Partial<UserProfileResponse>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = mergeUserProfile(currentUser, updatedUser);
      syncStoredAccount(nextUser);
      return nextUser;
    });
  };

  const handleProfileInputChange = (field: keyof ProfileFormState, value: string) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handlePasswordInputChange = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleTabChange = (tab: TabKey) => {
    // Gating payment-account
    if (tab === 'payment-account' && !isLandlord) return;

    setActiveTab(tab);
    if (tab !== 'profile') setIsProfileFormOpen(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const hoVaTen = profileForm.hoVaTen.trim();
    const email = profileForm.email.trim();
    const diaChi = profileForm.diaChi.trim();

    if (!hoVaTen) {
      message.warning('Vui lòng nhập tên hiển thị');
      return;
    }

    setSavingProfile(true);

    try {
      const updatedUser = await updateUser(user.maNguoiDung, {
        hoVaTen,
        email,
        diaChi,
      });
      applyUpdatedUser(updatedUser);
      setProfileForm({
        hoVaTen: updatedUser.hoVaTen ?? hoVaTen,
        email: updatedUser.email ?? email,
        diaChi: updatedUser.diaChi ?? diaChi,
      });
      message.success('Cập nhật thông tin tài khoản thành công');
      setIsProfileFormOpen(false);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Cập nhật thông tin tài khoản thất bại'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.warning('Vui lòng chọn đúng file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.warning('Ảnh đại diện không được vượt quá 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const updatedUser = await uploadUserAvatar(user.maNguoiDung, file);
      applyUpdatedUser(updatedUser);
      message.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Upload ảnh đại diện thất bại'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!user) return;

    const phoneValue = newPhone.trim();

    if (!/^\d{9,11}$/.test(phoneValue)) {
      message.warning('Số điện thoại phải có 9 đến 11 chữ số');
      return;
    }

    if (phoneValue === user.soDienThoai) {
      message.warning('Số điện thoại mới đang trùng số hiện tại');
      return;
    }

    setSavingPhone(true);

    try {
      const updatedUser = await changePhoneNumber(user.maNguoiDung, phoneValue);
      applyUpdatedUser(updatedUser);
      setNewPhone('');
      setIsProfileFormOpen(false);
      setActiveTab('profile');
      message.success('Cập nhật số điện thoại thành công');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Cập nhật số điện thoại thất bại'));
    } finally {
      setSavingPhone(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (newPassword.length < 6) {
      message.warning('Mật khẩu mới cần tối thiểu 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      message.warning('Xác nhận mật khẩu mới chưa khớp');
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(user.maNguoiDung, newPassword);
      setPasswordForm(emptyPasswordForm);
      setIsProfileFormOpen(false);
      setActiveTab('profile');
      message.success('Cập nhật mật khẩu thành công');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Cập nhật mật khẩu thất bại'));
    } finally {
      setSavingPassword(false);
    }
  };

  const loadPaymentAccount = useCallback(async () => {
    if (!user) return;
    if (!isLandlord) return;

    setLoadingPaymentAccount(true);
    try {
      const accounts = await getPaymentAccountsByLandlord(user.maNguoiDung);
      const defaultAccount = (accounts ?? []).find((a) => a.isDefault === true) as
        | PaymentAccountDTO
        | undefined;

      if (!defaultAccount) {
        setPaymentAccountForm(emptyPaymentAccountForm);
        return;
      }

      setPaymentAccountForm({
        bankCode: defaultAccount.bankCode ?? '',
        bankAccount: defaultAccount.bankAccount ?? '',
        accountName: defaultAccount.accountName ?? '',
      });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không tải được thông tin ví thanh toán'));
    } finally {
      setLoadingPaymentAccount(false);
    }
  }, [isLandlord, user]);

  useEffect(() => {
    if (activeTab === 'payment-account') {
      void loadPaymentAccount();
    }
  }, [activeTab, loadPaymentAccount]);

  const handleSavePaymentAccount = async () => {
    if (!user) return;
    if (!isLandlord) return;

    const bankCode = paymentAccountForm.bankCode.trim();
    const bankAccount = paymentAccountForm.bankAccount.trim();
    const accountName = paymentAccountForm.accountName.trim();

    if (!bankCode || !bankAccount || !accountName) {
      message.warning('Vui lòng nhập đầy đủ thông tin ví thanh toán');
      return;
    }

    setSavingPaymentAccount(true);
    try {
      await upsertDefaultPaymentAccount(user.maNguoiDung, {
        bankCode,
        bankAccount,
        accountName,
      });

      message.success('Lưu ví thanh toán thành công');
      await loadPaymentAccount();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lưu ví thanh toán thất bại'));
    } finally {
      setSavingPaymentAccount(false);
    }
  };

  const renderProfileTab = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <i className="fas fa-user-lock"></i>
          <p>{loadError || 'Không có thông tin tài khoản'}</p>
          <button type="button" className="update-btn" onClick={loadAccount}>
            Tải lại
          </button>
        </div>
      );
    }

    return (
      <div id="profile-tab">
        <div className="profile-info">
          <div className="avatar">
            {user.anhDaiDien ? (
              <img src={user.anhDaiDien} alt="Ảnh đại diện" className="avatar-image" />
            ) : (
              <i className="fas fa-user"></i>
            )}
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Cập nhật ảnh đại diện"
            >
              <i className={`fas ${uploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="avatar-file-input"
            onChange={handleAvatarFileChange}
          />
          <div className="user-details">
            <div className="username">{displayName}</div>
            <div className="user-id">ID: {user.maNguoiDung}</div>
            <div className="account-role">
              <i className="fas fa-user-tag"></i> {displayRole}
            </div>
          </div>
          <button
            type="button"
            className="update-btn profile-edit-btn"
            onClick={() => setIsProfileFormOpen((current) => !current)}
          >
            <i className={`fas ${isProfileFormOpen ? 'fa-xmark' : 'fa-pen-to-square'}`}></i>
            {isProfileFormOpen ? 'Đóng cập nhật' : 'Cập nhật thông tin'}
          </button>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-mobile-alt"></i> Số điện thoại
            </div>
            <div className="info-value">{displayPhone}</div>
            <button
              type="button"
              className="change-link link-button"
              onClick={() => handleTabChange('phone')}
            >
              <i className="fas fa-exchange-alt"></i> Đổi số điện thoại
            </button>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-user"></i> Tên hiển thị
            </div>
            <div className="info-value">{displayName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-envelope"></i> Email
            </div>
            <div className="info-value">{displayEmail}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-location-dot"></i> Địa chỉ
            </div>
            <div className="info-value">{displayAddress}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-lock"></i> Mật khẩu
            </div>
            <div className="info-value">••••••••</div>
            <button
              type="button"
              className="change-link link-button"
              onClick={() => handleTabChange('password')}
            >
              <i className="fas fa-exchange-alt"></i> Đổi mật khẩu
            </button>
          </div>
        </div>

        {isProfileFormOpen && (
          <>
            <div className="divider"></div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Cập nhật thông tin tài khoản</div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Tên hiển thị</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.hoVaTen}
                    onChange={(event) => handleProfileInputChange('hoVaTen', event.target.value)}
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileForm.email}
                    onChange={(event) => handleProfileInputChange('email', event.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.diaChi}
                  onChange={(event) => handleProfileInputChange('diaChi', event.target.value)}
                />
              </div>
              <div className="action-group action-group-end">
                <button
                  type="button"
                  className="submit-btn secondary-btn"
                  onClick={() => setIsProfileFormOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleUpdateProfile}
                  disabled={savingProfile}
                >
                  <i className="fas fa-save"></i> {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPhoneTab = () => (
    <div id="phone-tab">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Thay đổi số điện thoại</div>
        </div>
        <div className="form-group">
          <label className="form-label">Số điện thoại hiện tại</label>
          <input type="text" className="form-input" value={user?.soDienThoai ?? ''} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Số điện thoại mới</label>
          <input
            type="tel"
            className="form-input"
            placeholder="Nhập số điện thoại mới"
            value={newPhone}
            onChange={(event) => setNewPhone(event.target.value)}
          />
        </div>
        <div className="action-group">
          <button
            type="button"
            className="submit-btn secondary-btn"
            onClick={() => handleTabChange('profile')}
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={handleUpdatePhone}
            disabled={savingPhone || !user}
          >
            <i className="fas fa-save"></i> {savingPhone ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordTab = () => (
    <div id="password-tab">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Thay đổi mật khẩu</div>
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu mới</label>
          <input
            type="password"
            className="form-input"
            placeholder="Nhập mật khẩu mới"
            value={passwordForm.newPassword}
            onChange={(event) => handlePasswordInputChange('newPassword', event.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            className="form-input"
            placeholder="Nhập lại mật khẩu mới"
            value={passwordForm.confirmPassword}
            onChange={(event) => handlePasswordInputChange('confirmPassword', event.target.value)}
          />
        </div>
        <div className="action-group">
          <button
            type="button"
            className="submit-btn secondary-btn"
            onClick={() => handleTabChange('profile')}
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={handleUpdatePassword}
            disabled={savingPassword || !user}
          >
            <i className="fas fa-save"></i> {savingPassword ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentAccountTab = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <i className="fas fa-user-lock"></i>
          <p>{loadError || 'Không có thông tin tài khoản'}</p>
          <button type="button" className="update-btn" onClick={loadAccount}>
            Tải lại
          </button>
        </div>
      );
    }

    return (
      <div id="payment-account-tab">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ví thanh toán</div>
          </div>

          <div className="form-group">
            <label className="form-label">Ngân hàng</label>
            <input
              type="text"
              className="form-input"
              value={paymentAccountForm.bankCode}
              placeholder="Ví dụ: VCB, BIDV..."
              onChange={(e) =>
                setPaymentAccountForm((prev) => ({ ...prev, bankCode: e.target.value }))
              }
              disabled={loadingPaymentAccount || savingPaymentAccount}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số tài khoản</label>
            <input
              type="text"
              className="form-input"
              value={paymentAccountForm.bankAccount}
              placeholder="Nhập số tài khoản"
              onChange={(e) =>
                setPaymentAccountForm((prev) => ({ ...prev, bankAccount: e.target.value }))
              }
              disabled={loadingPaymentAccount || savingPaymentAccount}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tên chủ tài khoản</label>
            <input
              type="text"
              className="form-input"
              value={paymentAccountForm.accountName}
              placeholder="Nhập tên chủ tài khoản"
              onChange={(e) =>
                setPaymentAccountForm((prev) => ({ ...prev, accountName: e.target.value }))
              }
              disabled={loadingPaymentAccount || savingPaymentAccount}
            />
          </div>

          <div className="action-group">
            <button
              type="button"
              className="submit-btn secondary-btn"
              onClick={() => handleTabChange('profile')}
              disabled={loadingPaymentAccount || savingPaymentAccount}
            >
              <i className="fas fa-arrow-left"></i> Quay lại
            </button>
            <button
              type="button"
              className="submit-btn"
              onClick={handleSavePaymentAccount}
              disabled={loadingPaymentAccount || savingPaymentAccount}
            >
              <i className="fas fa-save"></i> {savingPaymentAccount ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Đang tải thông tin tài khoản...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'phone':
        return renderPhoneTab();
      case 'password':
        return renderPasswordTab();
      case 'payment-account':
        return renderPaymentAccountTab();
      default:
        return null;
    }
  };

  return (
    <div className="main-layout">
      <Navbar />
      <div className="container">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => handleTabChange('phone')}
          >
            Đổi số điện thoại
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => handleTabChange('password')}
          >
            Đổi mật khẩu
          </button>

          {isLandlord && (
            <button
              type="button"
              className={`tab ${activeTab === 'payment-account' ? 'active' : ''}`}
              onClick={() => handleTabChange('payment-account')}
            >
              <i className="fas fa-wallet" style={{ marginRight: 8 }}></i>
              Ví thanh toán
            </button>
          )}
        </div>
        <div className="content">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default AccountManagement;

