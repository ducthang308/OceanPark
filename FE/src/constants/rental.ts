export const RENTAL_TERM_OPTIONS = [3, 6, 12] as const;

export const DEFAULT_RENTAL_TERM_MONTHS = 6;

export type RentalTermMonth = (typeof RENTAL_TERM_OPTIONS)[number];

export const getRentalTermLabel = (months: number) => `${months} tháng`;
