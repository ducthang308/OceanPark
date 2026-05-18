import { getRoleId } from '../constants/roles';
import type { RoleId } from '../constants/roles';
import type { LoginResponse } from '../services/types/auth.types';

export type AuthUser = Omit<LoginResponse, 'token'> & {
  maVaiTro?: RoleId;
  anhDaiDien?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  roleId: RoleId | null;
};

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  userId: 'userId',
  hoVaTen: 'hoVaTen',
  email: 'email',
  vaiTro: 'vaiTro',
  maVaiTro: 'maVaiTro',
} as const;

export const AUTH_SESSION_CLEARED_EVENT = 'auth-session:cleared';
export const AUTH_SESSION_CHANGED_EVENT = 'auth-session:changed';

const readStoredUser = (): AuthUser | null => {
  const rawUser = localStorage.getItem(STORAGE_KEYS.user);

  if (rawUser) {
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }

  const maNguoiDung = localStorage.getItem(STORAGE_KEYS.userId);
  const hoVaTen = localStorage.getItem(STORAGE_KEYS.hoVaTen);

  if (!maNguoiDung || !hoVaTen) return null;

  return {
    maNguoiDung,
    hoVaTen,
    soDienThoai: '',
    email: localStorage.getItem(STORAGE_KEYS.email) ?? '',
    vaiTro: localStorage.getItem(STORAGE_KEYS.vaiTro) ?? '',
    anhDaiDien: null,
    maVaiTro: getRoleId(
      localStorage.getItem(STORAGE_KEYS.maVaiTro),
      localStorage.getItem(STORAGE_KEYS.vaiTro),
    ) ?? undefined,
  };
};

export const saveAuthSession = (loginResponse: LoginResponse): AuthSession => {
  const { token, ...userInfo } = loginResponse;
  const roleId = getRoleId(userInfo.maVaiTro, userInfo.vaiTro);
  const user: AuthUser = {
    ...userInfo,
    maVaiTro: roleId ?? undefined,
  };

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.userId, user.maNguoiDung);
  localStorage.setItem(STORAGE_KEYS.hoVaTen, user.hoVaTen);
  localStorage.setItem(STORAGE_KEYS.email, user.email);
  localStorage.setItem(STORAGE_KEYS.vaiTro, user.vaiTro);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

  if (roleId) {
    localStorage.setItem(STORAGE_KEYS.maVaiTro, roleId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.maVaiTro);
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));

  return {
    token,
    user,
    roleId,
  };
};

export const getAuthSession = (): AuthSession | null => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return null;

  const user = readStoredUser();
  if (!user) return null;

  const roleId = getRoleId(
    localStorage.getItem(STORAGE_KEYS.maVaiTro) ?? user.maVaiTro,
    user.vaiTro,
  );

  return {
    token,
    user: {
      ...user,
      maVaiTro: roleId ?? undefined,
    },
    roleId,
  };
};

export const clearAuthSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('chatbot_history');
  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};
