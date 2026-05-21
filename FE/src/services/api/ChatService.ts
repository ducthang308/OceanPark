import axiosClient from './AxiosClient';

export interface ChatRoomDTO {
  maPhongChat: string;
  loaiPhongChat: string;
  maNguoiDung1: string;
  tenNguoiDung1: string;
  maNguoiDung2: string;
  tenNguoiDung2: string;
  maBaiDang?: string | null;
  tieuDeBaiDang?: string | null;
  tinNhanCuoi?: string;
  thoiGianTinNhanCuoi?: string;
  ngayTao?: string;
}

export interface ChatMessageDTO {
  maTinNhan: string;
  maPhongChat: string;
  maNguoiGui: string;
  tenNguoiGui: string;
  noiDung: string;
  loaiTinNhan: string;
  tepDinhKemUrl?: string | null;
  trangThai?: string;
  thoiGianGui: string;
}

export interface CreateChatRoomRequest {
  maNguoiDung1: string;
  maNguoiDung2: string;
  maBaiDang?: string | null;
  loaiPhongChat: string;
}

export interface SendMessageRequest {
  maPhongChat: string;
  maNguoiGui: string;
  noiDung: string;
  loaiTinNhan?: string;
  tepDinhKemUrl?: string | null;
}

export interface ChatAttachmentDTO {
  url: string;
  originalName?: string;
  contentType?: string;
  size?: number;
}

/**
 * Lấy hoặc tạo phòng chat giữa 2 người dùng
 */
export const getOrCreateRoom = async (request: CreateChatRoomRequest): Promise<ChatRoomDTO> => {
  const response = await axiosClient.post<ChatRoomDTO>('/api/v1/chat/rooms', request);
  return response.data;
};

/**
 * Lấy danh sách tất cả các phòng chat của một người dùng
 */
export const getRoomsByUser = async (maNguoiDung: string): Promise<ChatRoomDTO[]> => {
  const response = await axiosClient.get<ChatRoomDTO[]>(`/api/v1/chat/rooms/user/${maNguoiDung}`);
  return response.data;
};

/**
 * Lấy lịch sử tin nhắn của một phòng chat cụ thể
 */
export const getMessages = async (maPhongChat: string): Promise<ChatMessageDTO[]> => {
  const response = await axiosClient.get<ChatMessageDTO[]>(`/api/v1/chat/rooms/${maPhongChat}/messages`);
  return response.data;
};

/**
 * Gửi tin nhắn qua REST API (fallback hoặc đính kèm ảnh)
 */
export const sendMessageRest = async (request: SendMessageRequest): Promise<ChatMessageDTO> => {
  const response = await axiosClient.post<ChatMessageDTO>('/api/v1/chat/messages', request);
  return response.data;
};

/**
 * Upload ảnh chat từ thiết bị, trả về URL đã lưu trên Cloudinary
 */
export const uploadChatImage = async (file: File): Promise<ChatAttachmentDTO> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<ChatAttachmentDTO>(
    '/api/v1/chat/attachments',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data;
};
