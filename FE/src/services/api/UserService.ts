import axios from 'axios';
import type { LoginResponse, IRegisterRequest } from '../types/auth.types';
import { saveAuthSession } from '../../utils/storage';
import axiosClient from './AxiosClient';

export const login = async (soDienThoai: string, matKhau: string): Promise<LoginResponse> => {
    try {
        const response = await axiosClient.post<LoginResponse>('/api/v1/nguoi-dung/login', {
            soDienThoai,
            matKhau,
        });

        const session = saveAuthSession(response.data);

        return {
            ...response.data,
            maVaiTro: session.roleId ?? response.data.maVaiTro,
        };
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
