import React, { useEffect, useState } from 'react';
import {
  DEFAULT_HOME_CATEGORIES,
  WARD_OPTIONS,
} from '../../../services/api/HomeService';
import type { IUserNeedFormValues } from '../../../services/types/user-need.types';
import './UserNeedDialog.css';

interface UserNeedDialogProps {
  open: boolean;
  mode?: 'create' | 'edit';
  loading?: boolean;
  initialValues?: Partial<IUserNeedFormValues>;
  onClose?: () => void;
  onSubmit: (values: IUserNeedFormValues) => Promise<void> | void;
}

type UserNeedPreferenceKey =
  | 'dayDuNoiThat'
  | 'coMayLanh'
  | 'coThangMay'
  | 'coMayGiat'
  | 'coNhaXe'
  | 'coTuLanh'
  | 'gioGiacTuDo'
  | 'coBanCong'
  | 'ganTrungTam'
  | 'ganBien';

const defaultValues: IUserNeedFormValues = {
  minPrice: null,
  maxPrice: null,
  phuong: '',
  loaiCanHo: '',
  coBanCong: false,
  dayDuNoiThat: false,
  coMayLanh: false,
  coThangMay: false,
  coMayGiat: false,
  coNhaXe: false,
  coTuLanh: false,
  gioGiacTuDo: false,
  ganTrungTam: false,
  ganBien: false,
};

const preferenceOptions: Array<{ key: UserNeedPreferenceKey; label: string }> = [
  { key: 'dayDuNoiThat', label: 'Đầy đủ nội thất' },
  { key: 'coMayLanh', label: 'Có máy lạnh' },
  { key: 'coThangMay', label: 'Có thang máy' },
  { key: 'coMayGiat', label: 'Có máy giặt' },
  { key: 'coNhaXe', label: 'Có nhà xe' },
  { key: 'coTuLanh', label: 'Có tủ lạnh' },
  { key: 'gioGiacTuDo', label: 'Giờ giấc tự do' },
  { key: 'coBanCong', label: 'Có ban công' },
  { key: 'ganTrungTam', label: 'Gần trung tâm' },
  { key: 'ganBien', label: 'Gần biển' },
];

const UserNeedDialog: React.FC<UserNeedDialogProps> = ({
  open,
  mode = 'create',
  loading = false,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<IUserNeedFormValues>(defaultValues);

  useEffect(() => {
    if (!open) return;

    setFormValues({
      ...defaultValues,
      ...initialValues,
      minPrice: initialValues?.minPrice ?? null,
      maxPrice: initialValues?.maxPrice ?? null,
      phuong: initialValues?.phuong ?? '',
      loaiCanHo: initialValues?.loaiCanHo ?? '',
    });
  }, [open, initialValues]);

  if (!open) return null;

  const handleChange = (
    key: keyof IUserNeedFormValues,
    value: string | number | boolean | null,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formValues);
  };

  const hasSelectedWardOption =
    !formValues.phuong || WARD_OPTIONS.some((ward) => ward.name === formValues.phuong);
  const hasSelectedCategoryOption =
    !formValues.loaiCanHo ||
    DEFAULT_HOME_CATEGORIES.some((category) => category.label === formValues.loaiCanHo);

  return (
    <div className="user-need-dialog">
      <div className="user-need-dialog__backdrop" onClick={onClose} />

      <div className="user-need-dialog__panel">
        <div className="user-need-dialog__header">
          <div>
            <p className="user-need-dialog__eyebrow">
              {mode === 'edit' ? 'Xem lại & chỉnh sửa' : 'Thiết lập lần đầu'}
            </p>
            <h2>Nhu cầu tìm thuê của bạn</h2>
            <p className="user-need-dialog__description">
              {mode === 'edit'
                ? 'Xem lại thông tin đã lưu và cập nhật khi nhu cầu tìm thuê thay đổi.'
                : 'Điền nhanh vài thông tin để hệ thống gợi ý bài đăng phù hợp hơn.'}
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              className="user-need-dialog__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              ×
            </button>
          )}
        </div>

        <form className="user-need-dialog__form" onSubmit={handleSubmit}>
          <div className="user-need-dialog__grid">
            <div className="user-need-field">
              <label>Mức giá tối thiểu</label>
              <input
                type="number"
                placeholder="Ví dụ: 3000000"
                value={formValues.minPrice ?? ''}
                onChange={(e) =>
                  handleChange(
                    'minPrice',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>

            <div className="user-need-field">
              <label>Mức giá tối đa</label>
              <input
                type="number"
                placeholder="Ví dụ: 7000000"
                value={formValues.maxPrice ?? ''}
                onChange={(e) =>
                  handleChange(
                    'maxPrice',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>

            <div className="user-need-field">
              <label>Phường / khu vực ưu tiên</label>
              <select
                value={formValues.phuong}
                onChange={(e) => handleChange('phuong', e.target.value)}
              >
                <option value="">Chọn phường</option>
                {!hasSelectedWardOption && (
                  <option value={formValues.phuong}>{formValues.phuong}</option>
                )}
                {WARD_OPTIONS.map((ward) => (
                  <option key={ward.name} value={ward.name}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="user-need-field">
              <label>Loại hình ưu tiên</label>
              <select
                value={formValues.loaiCanHo}
                onChange={(e) => handleChange('loaiCanHo', e.target.value)}
              >
                <option value="">Chọn loại hình</option>
                {!hasSelectedCategoryOption && (
                  <option value={formValues.loaiCanHo}>{formValues.loaiCanHo}</option>
                )}
                {DEFAULT_HOME_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="user-need-dialog__options">
            {preferenceOptions.map((option) => (
              <label className="user-need-check" key={option.key}>
                <input
                  type="checkbox"
                  checked={formValues[option.key]}
                  onChange={(e) => handleChange(option.key, e.target.checked)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className="user-need-dialog__actions">
            {onClose && (
              <button
                type="button"
                className="user-need-dialog__btn user-need-dialog__btn--ghost"
                onClick={onClose}
              >
                Để sau
              </button>
            )}

            <button
              type="submit"
              className="user-need-dialog__btn user-need-dialog__btn--primary"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật nhu cầu' : 'Lưu nhu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserNeedDialog;
