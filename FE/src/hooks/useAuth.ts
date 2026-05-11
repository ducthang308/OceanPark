import { useEffect, useState } from 'react';
import { getAuthSession } from '../utils/storage';

export const useAuth = () => {
  const [session, setSession] = useState(() => getAuthSession());

  useEffect(() => {
    const syncSession = () => setSession(getAuthSession());

    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    roleId: session?.roleId ?? null,
    isAuthenticated: Boolean(session?.token),
  };
};
