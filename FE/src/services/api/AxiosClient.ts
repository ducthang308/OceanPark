import axios from 'axios';
import { clearAuthSession } from '../../utils/storage';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8082',
    headers: {
        'Content-Type': 'application/json',
    },
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

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
