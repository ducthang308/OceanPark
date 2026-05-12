import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import './LoginPage.css';
import Register from '../Register/Register.tsx';

import PageBanner from '../../components/sections/PageBanner/PageBanner.tsx';
import { login } from '../../services/api/UserService.ts';
import { getDefaultPathByRole } from '../../constants/roles.ts';

const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8082/oauth2/authorization/google';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(phone, password);
            navigate(getDefaultPathByRole(response.maVaiTro), { replace: true });
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }

    };

    return (
        <>
            <PageBanner
                title="Đăng nhập tài khoản"
                backgroundImage={'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MH'}
                breadcrumbs={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Đăng nhập tài khoản / Đăng ký tài khoản' },
                ]}
                height="md"
            />

            <div className="login-wrapper">
                <div className="login-form">
                    <div className="login-tabs">
                        <span
                            className={activeTab === 'login' ? 'active-tab' : 'inactive-tab'}
                            onClick={() => setActiveTab('login')}
                        >
                            Đăng nhập
                        </span>
                        <span
                            className={activeTab === 'register' ? 'active-tab' : 'inactive-tab'}
                            onClick={() => setActiveTab('register')}
                        >
                            Đăng ký tài khoản
                        </span>
                    </div>

                    {activeTab === 'login' ? (
                        <>
                            <form onSubmit={handleLogin}>
                                <input
                                    type="text"
                                    placeholder="Số điện thoại"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {error && <p className="error-msg">{error}</p>}

                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Đang đăng nhập' : 'Đăng nhập'}
                                </button>
                            </form>

                            <Link to="/forgot-password" className="forgot-password">
                                Quên mật khẩu?
                            </Link>

                            <div className="divider">
                                <span>hoặc đăng nhập bằng</span>
                            </div>

                            <div className="social-login-button">
                                <button className="google-btn"
                                    type = "button"
                                    onClick = {handleGoogleLogin}
                                    disabled = {loading}>
                                    <img
                                        src="https://img.icons8.com/color/24/000000/google-logo.png"
                                        alt="Google"
                                    />
                                    Google
                                </button>
                                <button className="facebook-btn">
                                    <img
                                        src="https://img.icons8.com/color/24/000000/facebook-new.png"
                                        alt="Facebook"
                                    />
                                    Facebook
                                </button>
                            </div>
                        </>
                    ) : (
                        <Register />
                    )}
                </div>
            </div>

        </>
    );
};

export default LoginPage;
