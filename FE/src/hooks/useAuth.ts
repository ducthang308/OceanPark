import { useEffect, useState } from 'react';
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_CLEARED_EVENT,
  getAuthSession,
} from '../utils/storage';

export const useAuth = () => {
  const [session, setSession] = useState(() => getAuthSession());

  useEffect(() => {
    const syncSession = () => setSession(getAuthSession());

    window.addEventListener('storage', syncSession);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, syncSession);
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    roleId: session?.roleId ?? null,
    isAuthenticated: Boolean(session?.token),
  };
};
