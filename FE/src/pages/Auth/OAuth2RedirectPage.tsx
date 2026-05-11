import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDefaultPathByRole } from '../../constants/roles';
import { getCurrentUser } from '../../services/api/UserService';
import type { LoginResponse } from '../../services/types/auth.types';
import { clearAuthSession, saveAuthSession } from '../../utils/storage';

const OAuth2RedirectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    const token = searchParams.get('token');

    if (error || !token) {
      navigate('/login', {
        replace: true,
        state: { error: 'Đăng nhập Google thất bại' },
      });
      return;
    }

    const handleOAuthSuccess = async () => {
      try {
        localStorage.setItem('token', token);

        const user = await getCurrentUser();

        const loginResponse: LoginResponse = {
          token,
          maNguoiDung: user.maNguoiDung,
          hoVaTen: user.hoVaTen,
          soDienThoai: user.soDienThoai,
          email: user.email ?? '',
          vaiTro: user.vaiTro ?? '',
          maVaiTro: user.maVaiTro ?? undefined,
        };

        const session = saveAuthSession(loginResponse);

        navigate(getDefaultPathByRole(session.roleId), { replace: true });
      } catch {
        clearAuthSession();
        navigate('/login', {
          replace: true,
          state: { error: 'Không thể xử lý đăng nhập Google' },
        });
      }
    };

    handleOAuthSuccess();
  }, [navigate, searchParams]);

  return <div>Đang đăng nhập bằng Google...</div>;
};

export default OAuth2RedirectPage;
