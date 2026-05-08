import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../services/api/AxiosClient';
import './ForgotPassword.css';

const getApiErrorMessage = (err: any, fallback: string) => {
    const data = err.response?.data;

    if (typeof data === 'string') {
        return data;
    }

    return data?.message || fallback;
};

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await axiosClient.post('/api/v1/nguoi-dung/forgot-password', {
                email,
            });

            setMessage(res.data.message || 'Đã gửi email đặt lại mật khẩu');
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Gửi email thất bại'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="password-page">
            <div className="password-shell password-shell--single">
                <div className="password-card">
                    <div className="password-card__header">
                        <span className="password-eyebrow">Bảo mật tài khoản</span>
                        <h1>Quên mật khẩu</h1>
                        <p>
                            Nhập email đã đăng ký, hệ thống sẽ gửi đường dẫn xác nhận đặt lại mật khẩu.
                        </p>
                    </div>

                    <form className="password-form" onSubmit={handleSubmit}>
                        <label htmlFor="forgot-email">Email</label>
                        <div className="password-input">
                            <span aria-hidden="true">@</span>
                            <input
                                id="forgot-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {message && <div className="password-alert password-alert--success">{message}</div>}
                        {error && <div className="password-alert password-alert--error">{error}</div>}

                        <button className="password-submit" type="submit" disabled={loading}>
                            {loading ? 'Đang gửi email...' : 'Gửi email xác nhận'}
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

export default ForgotPasswordPage;
