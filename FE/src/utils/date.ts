export const formatDate = (value?: string | Date): string => {
  if (!value) return '--';
  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
