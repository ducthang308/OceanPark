import axios from 'axios';

const getResponseMessage = (data: unknown) => {
  if (typeof data === 'string') return data.trim();

  if (data && typeof data === 'object') {
    const { message, error: errorText } = data as {
      message?: unknown;
      error?: unknown;
    };

    if (typeof message === 'string') return message.trim();
    if (typeof errorText === 'string') return errorText.trim();
  }

  return '';
};

const stripJwtFilterPrefix = (message: string) =>
  message.replace(/^Không xác thực được token:\s*/i, '').trim();

const isBusinessErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('không thể xóa') ||
    normalizedMessage.includes('đang được sử dụng') ||
    normalizedMessage.includes('đang liên kết') ||
    normalizedMessage.includes('liên kết với')
  );
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const responseMessage = stripJwtFilterPrefix(getResponseMessage(data));

    if (responseMessage && (status !== 401 || isBusinessErrorMessage(responseMessage))) {
      return responseMessage;
    }

    if (status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này';
  }

  return fallback;
};
