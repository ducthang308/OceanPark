import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../services/api/AxiosClient';
import './ForgotPassword.css';

const getApiErrorMessage = (err: any, fallback: string) => {
    const data = err.response?.data;

    if (typeof data === 'string') {
        return data;
    }

    return data?.message || fallback;
};

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token') || '';

    const [matKhauMoi, setMatKhauMoi] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getPasswordStrength = () => {
        if (matKhauMoi.length >= 10 && /[A-Z]/.test(matKhauMoi) && /\d/.test(matKhauMoi)) {
            return {
                label: 'Mạnh',
                className: 'password-strength__bar--strong',
            };
        }

        if (matKhauMoi.length >= 6) {
            return {
                label: 'Trung bình',
                className: 'password-strength__bar--medium',
            };
        }

        return {
            label: 'Yếu',
            className: 'password-strength__bar--weak',
        };
    };

    const passwordStrength = getPasswordStrength();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!token) {
            setError('Thiếu token đặt lại mật khẩu');
            return;
        }

        if (matKhauMoi !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }

        setLoading(true);

        try {
            const res = await axiosClient.post('/api/v1/nguoi-dung/reset-password', {
                token,
                matKhauMoi,
            });

            localStorage.clear();
            setMessage(res.data.message || 'Đổi mật khẩu thành công');

            setTimeout(() => {
                navigate('/login');
            }, 1200);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Đổi mật khẩu thất bại'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="password-page">
            <div className="password-shell password-shell--single">
                <div className="password-card">
                    <div className="password-card__header">
                        <span className="password-eyebrow">Xác nhận bảo mật</span>
                        <h1>Đặt lại mật khẩu</h1>
                        <p>Tạo mật khẩu mới cho tài khoản của bạn.</p>
                    </div>

                    {!token && (
                        <div className="password-alert password-alert--error password-token-warning">
                            Thiếu token đặt lại mật khẩu. Vui lòng mở lại đường dẫn trong email.
                        </div>
                    )}

                    <form className="password-form" onSubmit={handleSubmit}>
                        <label htmlFor="new-password">Mật khẩu mới</label>
                        <div className="password-input">
                            <span aria-hidden="true">*</span>
                            <input
                                id="new-password"
                                type="password"
                                placeholder="Tối thiểu 6 ký tự"
                                value={matKhauMoi}
                                onChange={(e) => setMatKhauMoi(e.target.value)}
                                required
                            />
                        </div>

                        {matKhauMoi && (
                            <div className="password-strength" aria-live="polite">
                                <div className="password-strength__track">
                                    <span className={`password-strength__bar ${passwordStrength.className}`} />
                                </div>
                                <span className="password-strength__text">
                                    Độ mạnh mật khẩu: {passwordStrength.label}
                                </span>
                            </div>
                        )}

                        <label htmlFor="confirm-password">Nhập lại mật khẩu</label>
                        <div className="password-input">
                            <span aria-hidden="true">*</span>
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {message && <div className="password-alert password-alert--success">{message}</div>}
                        {error && <div className="password-alert password-alert--error">{error}</div>}

                        <button className="password-submit" type="submit" disabled={loading || !token}>
                            {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                        </button>
                    </form>

                    <div className="password-card__footer">
                        <Link to="/login">Quay lại đăng nhập</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResetPasswordPage;
