import type { IUserNeed, IUserNeedFormValues } from '../types/user-need.types';
import { userNeedsMock } from './user-needs.mock';

class UserNeedMockService {
  async getByUserId(userId: number): Promise<IUserNeed | null> {
    const item = userNeedsMock.find((x) => x.idNguoiDung === userId);
    return item || null; // chưa có → null → dialog hiện
  }

  async createOrUpdate(userId: number, payload: IUserNeedFormValues): Promise<IUserNeed> {
    const existingIndex = userNeedsMock.findIndex((x) => x.idNguoiDung === userId);

    const nextItem: IUserNeed = {
      id: existingIndex >= 0 ? userNeedsMock[existingIndex].id : Date.now(),
      idNguoiDung: userId,
      minPrice: payload.minPrice,
      maxPrice: payload.maxPrice,
      phuong: payload.phuong || null,
      loaiCanHo: payload.loaiCanHo || null,
      coBanCong: payload.coBanCong,
      dayDuNoiThat: payload.dayDuNoiThat,
      ganTrungTam: payload.ganTrungTam,
      ganBien: payload.ganBien,
      ngayTao:
        existingIndex >= 0
          ? userNeedsMock[existingIndex].ngayTao || new Date().toISOString()
          : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      userNeedsMock[existingIndex] = nextItem;
    } else {
      userNeedsMock.push(nextItem);
    }

    return nextItem;
  }
}

export const userNeedMockService = new UserNeedMockService();