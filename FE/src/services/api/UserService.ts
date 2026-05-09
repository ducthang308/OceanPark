import axios from 'axios';
import type { LoginResponse, IRegisterRequest, ILoginRequest } from '../types/auth.types';
import axiosClient from './AxiosClient';

export const login = async (soDienThoai: string, matKhau: string): Promise<LoginResponse> => {
    try {
        const response = await axiosClient.post<LoginResponse>('/api/v1/nguoi-dung/login', {
            soDienThoai,
            matKhau,
        });

        const { token, ...userInfo } = response.data;

        // Lưu token riêng để gắn vào Authorization header
        localStorage.setItem('token', token);

        // Lưu từng field riêng lẻ (giữ lại cũ)
        localStorage.setItem('userId', userInfo.maNguoiDung);
        localStorage.setItem('hoVaTen', userInfo.hoVaTen);
        localStorage.setItem('vaiTro', userInfo.vaiTro);

        // Lưu toàn bộ thông tin user (trừ token) dưới dạng JSON
        localStorage.setItem('user', JSON.stringify(userInfo));

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Đăng nhập thất bại');
        }
        throw new Error('Đăng nhập thất bại');
    }
};

export const register = async (userData: IRegisterRequest): Promise<any> => {
    try {
        const response = await axiosClient.post('/api/v1/nguoi-dung/register', userData);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Đăng ký thất bại');
        }
        throw new Error('Đăng ký thất bại');
    }
};
