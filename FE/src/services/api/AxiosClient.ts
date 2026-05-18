import axios from 'axios';
import { clearAuthSession } from '../../utils/storage';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8082',
    headers: {
        'Content-Type': 'application/json',
    },
});

const PUBLIC_PATH_PREFIXES = [
    '/',
    '/posts',
    '/danh-muc',
    '/blog',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/oauth2',
];

const isPublicRoute = (pathname: string) =>
    PUBLIC_PATH_PREFIXES.some((path) => {
        if (path === '/') return pathname === '/';
        return pathname === path || pathname.startsWith(`${path}/`);
    });

// Thêm interceptor để tự động gắn token vào mọi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    config.headers = config.headers ?? {};
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Xóa session cũ khi token hết hạn/không hợp lệ.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthSession();

            if (!isPublicRoute(window.location.pathname) && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
