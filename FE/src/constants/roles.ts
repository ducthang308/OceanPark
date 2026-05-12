export const ROLE_ID = {
  ADMIN: '1',
  NGUOI_THUE: '2',
  NGUOI_CHO_THUE: '3',
} as const;

export type RoleId = (typeof ROLE_ID)[keyof typeof ROLE_ID];

export const AUTHENTICATED_ROLE_IDS: readonly RoleId[] = [
  ROLE_ID.ADMIN,
  ROLE_ID.NGUOI_THUE,
  ROLE_ID.NGUOI_CHO_THUE,
];

export const LANDLORD_ROLE_IDS: readonly RoleId[] = [
  ROLE_ID.ADMIN,
  ROLE_ID.NGUOI_CHO_THUE,
];

const ROLE_NAME_TO_ID: Record<string, RoleId> = {
  admin: ROLE_ID.ADMIN,
  'người thuê': ROLE_ID.NGUOI_THUE,
  'nguoi thue': ROLE_ID.NGUOI_THUE,
  'người cho thuê': ROLE_ID.NGUOI_CHO_THUE,
  'nguoi cho thue': ROLE_ID.NGUOI_CHO_THUE,
};

export const isRoleId = (value?: string | null): value is RoleId =>
  value === ROLE_ID.ADMIN ||
  value === ROLE_ID.NGUOI_THUE ||
  value === ROLE_ID.NGUOI_CHO_THUE;

export const getRoleIdFromName = (roleName?: string | null): RoleId | null => {
  if (!roleName) return null;
  return ROLE_NAME_TO_ID[roleName.trim().toLowerCase()] ?? null;
};

export const getRoleId = (maVaiTro?: string | null, vaiTro?: string | null): RoleId | null => {
  if (isRoleId(maVaiTro)) return maVaiTro;
  return getRoleIdFromName(vaiTro);
};

export const getDefaultPathByRole = (roleId?: string | null) => {
  if (roleId === ROLE_ID.ADMIN) return '/admin';
  if (roleId === ROLE_ID.NGUOI_CHO_THUE) return '/list-post';
  return '/';
};
