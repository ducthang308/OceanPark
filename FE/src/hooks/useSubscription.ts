import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import axios from 'axios';

export const useSubscription = () => {
  const { user } = useAuth();
  const [hasActivePackage, setHasActivePackage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    if (!user?.maNguoiDung) {
      setHasActivePackage(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8081/api/v1/hoa-don/nguoi-dung/${user.maNguoiDung}`);
      const invoices = response.data;
      
      // Check if there is any SUCCESS invoice for posting (DANG_BAI) that is still valid
      const activePackage = invoices.find((inv: any) => 
        inv.loaiHoaDon === 'DANG_BAI' && 
        inv.trangThaiThanhToan === 'SUCCESS' && 
        inv.trangThaiHieuLuc === 'DANG_HIEU_LUC'
      );

      setHasActivePackage(!!activePackage);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActivePackage(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user?.maNguoiDung]);

  return { hasActivePackage, loading, refresh: checkSubscription };
};
