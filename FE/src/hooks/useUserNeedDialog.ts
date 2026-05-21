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
    coMayLanh: Boolean(need.coMayLanh),
    coThangMay: Boolean(need.coThangMay),
    coMayGiat: Boolean(need.coMayGiat),
    coNhaXe: Boolean(need.coNhaXe),
    coTuLanh: Boolean(need.coTuLanh),
    gioGiacTuDo: Boolean(need.gioGiacTuDo),
    ganTrungTam: Boolean(need.ganTrungTam),
    ganBien: Boolean(need.ganBien),
  };
};

export const useUserNeedDialog = (maNguoiDung?: string | null) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedNeed, setSavedNeed] = useState<NhuCauNguoiDungDTO | null>(null);
  const [initialValues, setInitialValues] =
    useState<Partial<IUserNeedFormValues>>();

  const loadNeed = async () => {
    if (!maNguoiDung) return null;

    const need = await getUserNeedByUserId(maNguoiDung);
    setSavedNeed(need);
    setInitialValues(toFormValues(need));

    return need;
  };

  useEffect(() => {
    const checkNeed = async () => {
      if (!maNguoiDung) return;

      try {
        setLoading(true);

        const need = await loadNeed();
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
      setSavedNeed(savedNeed);
      setInitialValues(toFormValues(savedNeed));
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async () => {
    if (!maNguoiDung) return;

    try {
      setLoading(true);
      await loadNeed();
      setOpen(true);
    } catch (error) {
      console.error(error);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    open,
    loading,
    hasNeed: Boolean(savedNeed),
    initialValues,
    close: () => setOpen(false),
    openDialog,
    setOpen,
    submit,
  };
};
