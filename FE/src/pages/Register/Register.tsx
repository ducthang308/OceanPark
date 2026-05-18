import { useState } from 'react';
import './Register.css';
import { register } from '../../services/api/UserService.ts';
import { ROLE_ID } from '../../constants/roles.ts';
import type { RoleId } from '../../constants/roles.ts';

type RegisterFormData = {
    hoVaTen: string;
    email: string;
    soDienThoai: string;
    matKhau: string;
    retypeMatKhau: string;
    maVaiTro: RoleId;
};

type RegisterFormProps = {
    onRegisterSuccess?: (phoneNumber: string) => void;
};

const RegisterForm = ({ onRegisterSuccess }: RegisterFormProps) => {
    const [formData, setFormData] = useState<RegisterFormData>({
        hoVaTen: '',
        email: '',
        soDienThoai: '',
        matKhau: '',
        retypeMatKhau: '',
        maVaiTro: ROLE_ID.NGUOI_THUE,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'maVaiTro') {
            setFormData(prev => ({ ...prev, maVaiTro: value as RoleId }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.matKhau !== formData.retypeMatKhau) {
            alert('Mật khẩu nhập lại không khớp!');
            return;
        }
        try {
            const payload = {
                hoVaTen: formData.hoVaTen,
                email: formData.email,
                soDienThoai: formData.soDienThoai,
                matKhau: formData.matKhau,
                maVaiTro: formData.maVaiTro,
            };
            const res = await register(payload);
            alert('Đăng ký thành công!');

            console.log('User mới:', res);

            onRegisterSuccess?.(formData.soDienThoai);
        } catch (err: any) {
            alert(err.message || 'Đăng ký thất bại');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="hoVaTen"
                placeholder="Họ và tên"
                value={formData.hoVaTen}
                onChange={handleChange}
                required
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            <input
                type="text"
                name="soDienThoai"
                placeholder="Số điện thoại"
                value={formData.soDienThoai}
                onChange={handleChange}
                required
            />
            <input
                type="password"
                name="matKhau"
                placeholder="Mật khẩu"
                value={formData.matKhau}
                onChange={handleChange}
                required
            />
            <input
                type="password"
                name="retypeMatKhau"
                placeholder="Nhập lại mật khẩu"
                value={formData.retypeMatKhau}
                onChange={handleChange}
                required
            />

            <div className="account-type">
                <label className="account-label"><strong>Loại tài khoản</strong></label>
                <div className="radio-group">
                    <label className="radio-option">
                        <input
                            type="radio"
                            name="maVaiTro"
                            value={ROLE_ID.NGUOI_THUE}
                            checked={formData.maVaiTro === ROLE_ID.NGUOI_THUE}
                            onChange={handleChange}
                        />
                        Người Thuê
                    </label>
                    <label className="radio-option">
                        <input
                            type="radio"
                            name="maVaiTro"
                            value={ROLE_ID.NGUOI_CHO_THUE}
                            checked={formData.maVaiTro === ROLE_ID.NGUOI_CHO_THUE}
                            onChange={handleChange}
                        />
                        Người Cho Thuê
                    </label>
                </div>
            </div>

            <button type="submit" className="login-btn">Tạo tài khoản</button>

            <div className="site-footer">
                <p>
                    Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các
                    <a href="#"> quy định sử dụng</a> cũng như
                    <a href="#"> chính sách bảo mật</a> của chúng tôi
                </p>
                <p>Bản quyền © 2015 - 2025 PhongtroHuyThang.com</p>
            </div>
        </form>
    );
};

export default RegisterForm;
