import axios from 'axios';
import type { AuthUserResponse, LoginResponse, IRegisterRequest } from '../types/auth.types';
import { saveAuthSession } from '../../utils/storage';
import axiosClient from './AxiosClient';

export type UserProfileResponse = AuthUserResponse & {
    diaChi?: string | null;
    trangThai?: boolean | null;
    facebookAccount?: string | null;
    googleAccount?: string | null;
};

export type UpdateUserPayload = {
    maVaiTro?: string | null;
    hoVaTen?: string;
    email?: string | null;
    diaChi?: string | null;
    soDienThoai?: string;
    trangThai?: boolean | null;
    matKhau?: string;
    facebookAccount?: string | null;
    googleAccount?: string | null;
    anhDaiDien?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (typeof data === 'string' && data.trim()) return data;
        if (data && typeof data === 'object' && 'message' in data) {
            const messageValue = (data as { message?: unknown }).message;
            if (typeof messageValue === 'string' && messageValue.trim()) return messageValue;
        }
    }

    return fallback;
};

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
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Đăng nhập thất bại'));
    }
};

export const register = async (userData: IRegisterRequest): Promise<unknown> => {
    try {
        const response = await axiosClient.post('/api/v1/nguoi-dung/register', userData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Đăng ký thất bại'));
    }
};

export const getCurrentUser = async (): Promise<AuthUserResponse> => {
    const response = await axiosClient.get<AuthUserResponse>('/api/v1/nguoi-dung/me');
    return response.data;
};

export const getUserById = async (maNguoiDung: string): Promise<UserProfileResponse> => {
    const response = await axiosClient.get<UserProfileResponse>(`/api/v1/nguoi-dung/${maNguoiDung}`);
    return response.data;
};

export const updateUser = async (
    maNguoiDung: string,
    payload: UpdateUserPayload,
): Promise<UserProfileResponse> => {
    const response = await axiosClient.put<UserProfileResponse>(
        `/api/v1/nguoi-dung/${maNguoiDung}`,
        payload,
    );
    return response.data;
};

export const changePhoneNumber = async (
    maNguoiDung: string,
    soDienThoai: string,
): Promise<UserProfileResponse> => {
    return updateUser(maNguoiDung, { soDienThoai });
};

export const changePassword = async (
    maNguoiDung: string,
    matKhau: string,
): Promise<UserProfileResponse> => {
    return updateUser(maNguoiDung, { matKhau });
};
