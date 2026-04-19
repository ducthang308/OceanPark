import { useEffect, useState } from 'react';
import { userNeedMockService } from '../services/mock/user-need.mock-service';

export const useUserNeedDialog = (userId?: number | null) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkNeed = async () => {
      if (!userId) return;

      setLoading(true);
      const need = await userNeedMockService.getByUserId(userId);

      setOpen(!need); // chưa có → mở dialog

      setLoading(false);
    };

    checkNeed();
  }, [userId]);

  return {
    open,
    loading,
    close: () => setOpen(false),
    openDialog: () => setOpen(true),
    setOpen,
  };
};