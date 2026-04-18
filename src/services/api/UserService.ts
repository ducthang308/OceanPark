import axios, { isAxiosError } from 'axios';
import type { LoginResponse } from '../types/auth.types';
import axiosClient from './AxiosClient';
import type { IRegisterRequest } from '../types/auth.types';

export const login = async (phone_number: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axiosClient.post<LoginResponse>('/api/v1/user/login', {
            phone_number,
            password
        });
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Đăng nhập thất bại');
        }
        throw new Error('Đăng nhập thất bại');
    }
};

export const register = async (userData: IRegisterRequest): Promise<IRegisterRequest> => {
    try {
        const response = await axiosClient.post<IRegisterRequest>('/api/v1/user/register', userData);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Đăng ký thất bại');
        }
        throw new Error('Đăng ký thất bại');
    }
};