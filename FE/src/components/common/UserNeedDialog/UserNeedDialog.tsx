import React, { useEffect, useState } from 'react';
import type { IUserNeedFormValues } from '../../../services/types/user-need.types';
import './UserNeedDialog.css';

interface UserNeedDialogProps {
  open: boolean;
  loading?: boolean;
  initialValues?: Partial<IUserNeedFormValues>;
  onClose?: () => void;
  onSubmit: (values: IUserNeedFormValues) => Promise<void> | void;
}

const defaultValues: IUserNeedFormValues = {
  minPrice: null,
  maxPrice: null,
  phuong: '',
  loaiCanHo: '',
  coBanCong: false,
  dayDuNoiThat: false,
  ganTrungTam: false,
  ganBien: false,
};

const UserNeedDialog: React.FC<UserNeedDialogProps> = ({
  open,
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
      coBanCong: initialValues?.coBanCong ?? false,
      dayDuNoiThat: initialValues?.dayDuNoiThat ?? false,
      ganTrungTam: initialValues?.ganTrungTam ?? false,
      ganBien: initialValues?.ganBien ?? false,
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

  return (
    <div className="user-need-dialog">
      <div className="user-need-dialog__backdrop" onClick={onClose} />

      <div className="user-need-dialog__panel">
        <div className="user-need-dialog__header">
          <div>
            <p className="user-need-dialog__eyebrow">Thiết lập lần đầu</p>
            <h2>Nhu cầu tìm thuê của bạn</h2>
            <p className="user-need-dialog__description">
              Điền nhanh vài thông tin để hệ thống gợi ý bài đăng phù hợp hơn.
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
              <input
                type="text"
                placeholder="Ví dụ: Hải Châu"
                value={formValues.phuong}
                onChange={(e) => handleChange('phuong', e.target.value)}
              />
            </div>

            <div className="user-need-field">
              <label>Loại hình ưu tiên</label>
              <select
                value={formValues.loaiCanHo}
                onChange={(e) => handleChange('loaiCanHo', e.target.value)}
              >
                <option value="">Chọn loại hình</option>
                <option value="Phòng trọ">Phòng trọ</option>
                <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
                <option value="Căn hộ chung cư">Căn hộ chung cư</option>
                <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                <option value="Căn hộ ở ghép">Căn hộ ở ghép</option>
                <option value="Căn hộ mini">Căn hộ mini</option>
                <option value="Mặt bằng cho thuê">Mặt bằng cho thuê</option>
              </select>
            </div>
          </div>

          <div className="user-need-dialog__options">
            <label className="user-need-check">
              <input
                type="checkbox"
                checked={formValues.coBanCong}
                onChange={(e) => handleChange('coBanCong', e.target.checked)}
              />
              <span>Có ban công</span>
            </label>

            <label className="user-need-check">
              <input
                type="checkbox"
                checked={formValues.dayDuNoiThat}
                onChange={(e) => handleChange('dayDuNoiThat', e.target.checked)}
              />
              <span>Đầy đủ nội thất</span>
            </label>

            <label className="user-need-check">
              <input
                type="checkbox"
                checked={formValues.ganTrungTam}
                onChange={(e) => handleChange('ganTrungTam', e.target.checked)}
              />
              <span>Gần trung tâm</span>
            </label>

            <label className="user-need-check">
              <input
                type="checkbox"
                checked={formValues.ganBien}
                onChange={(e) => handleChange('ganBien', e.target.checked)}
              />
              <span>Gần biển</span>
            </label>
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
              {loading ? 'Đang lưu...' : 'Lưu nhu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserNeedDialog;