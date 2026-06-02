export type ApartmentCartItem = {
  maBaiDang: string;
  title: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  address?: string;
  ward?: string;
  areaText?: string;
  coverImage?: string;
};

const APARTMENT_CART_KEY_PREFIX = 'apartmentCartItems';
const LEGACY_APARTMENT_CART_KEY = 'apartmentCartItems';
const GUEST_CART_OWNER = 'guest';

export const APARTMENT_CART_CHANGED_EVENT = 'apartment-cart:changed';

const notifyCartChanged = () => {
  window.dispatchEvent(new Event(APARTMENT_CART_CHANGED_EVENT));
};

const getCurrentCartOwner = () =>
  localStorage.getItem('userId') ||
  (() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return '';

    try {
      const user = JSON.parse(rawUser) as { maNguoiDung?: string };
      return user.maNguoiDung || '';
    } catch {
      return '';
    }
  })() ||
  GUEST_CART_OWNER;

const getApartmentCartKey = () => `${APARTMENT_CART_KEY_PREFIX}:${getCurrentCartOwner()}`;

const cleanupLegacyCart = () => {
  localStorage.removeItem(LEGACY_APARTMENT_CART_KEY);
};

const normalizeQuantity = (quantity: number, availableQuantity: number) => {
  const max = Math.max(availableQuantity || 0, 0);
  if (max === 0) return 0;
  return Math.min(Math.max(Math.floor(quantity) || 1, 1), max);
};

export const getApartmentCartItems = (): ApartmentCartItem[] => {
  cleanupLegacyCart();

  const key = getApartmentCartKey();
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    return value
      .filter((item) => item && typeof item.maBaiDang === 'string')
      .map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        availableQuantity: Math.max(Number(item.availableQuantity) || 0, 0),
        quantity: normalizeQuantity(Number(item.quantity) || 1, Number(item.availableQuantity) || 0),
      }))
      .filter((item) => item.quantity > 0);
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

export const saveApartmentCartItems = (items: ApartmentCartItem[]) => {
  cleanupLegacyCart();
  localStorage.setItem(getApartmentCartKey(), JSON.stringify(items));
  notifyCartChanged();
};

export const addApartmentToCart = (item: ApartmentCartItem) => {
  const items = getApartmentCartItems();
  const existingIndex = items.findIndex((cartItem) => cartItem.maBaiDang === item.maBaiDang);
  const nextItem = {
    ...item,
    availableQuantity: Math.max(item.availableQuantity || 0, 0),
    quantity: normalizeQuantity(item.quantity || 1, item.availableQuantity || 0),
  };

  if (nextItem.quantity <= 0) {
    throw new Error('Căn hộ này hiện không còn phòng trống');
  }

  if (existingIndex >= 0) {
    const current = items[existingIndex];
    items[existingIndex] = {
      ...current,
      ...nextItem,
      quantity: normalizeQuantity(current.quantity + nextItem.quantity, nextItem.availableQuantity),
    };
  } else {
    items.push(nextItem);
  }

  saveApartmentCartItems(items);
  return items;
};

export const updateApartmentCartQuantity = (maBaiDang: string, quantity: number) => {
  const items = getApartmentCartItems()
    .map((item) =>
      item.maBaiDang === maBaiDang
        ? {
            ...item,
            quantity: normalizeQuantity(quantity, item.availableQuantity),
          }
        : item,
    )
    .filter((item) => item.quantity > 0);

  saveApartmentCartItems(items);
  return items;
};

export const removeApartmentCartItem = (maBaiDang: string) => {
  const items = getApartmentCartItems().filter((item) => item.maBaiDang !== maBaiDang);
  saveApartmentCartItems(items);
  return items;
};

export const clearApartmentCart = () => {
  cleanupLegacyCart();
  localStorage.removeItem(getApartmentCartKey());
  notifyCartChanged();
};

export const clearApartmentCartItems = (maBaiDangList: string[]) => {
  const ids = new Set(maBaiDangList);
  const items = getApartmentCartItems().filter((item) => !ids.has(item.maBaiDang));
  saveApartmentCartItems(items);
  return items;
};

export const getApartmentCartTotalQuantity = () =>
  getApartmentCartItems().reduce((sum, item) => sum + item.quantity, 0);
