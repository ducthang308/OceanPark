import { useEffect, useState } from "react";
import type { IUserNeedFormValues } from "../services/types/user-need.types";
import {
  createOrUpdateUserNeed,
  getUserNeedByUserId,
  type NhuCauNguoiDungDTO,
} from "../services/api/UserNeedService";

const toFormValues = (
  need: NhuCauNguoiDungDTO | null
): Partial<IUserNeedFormValues> | undefined => {
  if (!need) return undefined;

  return {
    minPrice: need.minPrice,
    maxPrice: need.maxPrice,
    phuong: need.phuong || "",
    loaiCanHo: need.loaiCanHo || "",
    coBanCong: Boolean(need.coBanCong),
    dayDuNoiThat: Boolean(need.dayDuNoiThat),
    ganTrungTam: Boolean(need.ganTrungTam),
    ganBien: Boolean(need.ganBien),
  };
};

export const useUserNeedDialog = (maNguoiDung?: string | null) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] =
    useState<Partial<IUserNeedFormValues>>();

  useEffect(() => {
    const checkNeed = async () => {
      if (!maNguoiDung) return;

      try {
        setLoading(true);

        const need = await getUserNeedByUserId(maNguoiDung);
        setInitialValues(toFormValues(need));
        setOpen(!need);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkNeed();
  }, [maNguoiDung]);

  const submit = async (values: IUserNeedFormValues) => {
    if (!maNguoiDung) return;

    try {
      setLoading(true);
      const savedNeed = await createOrUpdateUserNeed(maNguoiDung, values);
      setInitialValues(toFormValues(savedNeed));
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    open,
    loading,
    initialValues,
    close: () => setOpen(false),
    openDialog: () => setOpen(true),
    setOpen,
    submit,
  };
};
