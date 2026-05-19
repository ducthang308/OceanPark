import axios from 'axios';
import { clearAuthSession } from '../../utils/storage';

const getResponseMessage = (data: unknown) => {
    if (typeof data === 'string') return data;

    if (data && typeof data === 'object') {
        const { message, error } = data as { message?: unknown; error?: unknown };
        if (typeof message === 'string') return message;
        if (typeof error === 'string') return error;
    }

    return '';
};

const isBusinessErrorReturnedAsUnauthorized = (data: unknown) => {
    const message = getResponseMessage(data).toLowerCase();

    return (
        message.includes('không thể xóa') ||
        message.includes('đang được sử dụng') ||
        message.includes('đang liên kết') ||
        message.includes('liên kết với')
    );
};

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
            if (isBusinessErrorReturnedAsUnauthorized(error.response.data)) {
                return Promise.reject(error);
            }

            clearAuthSession();

            if (!isPublicRoute(window.location.pathname) && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
