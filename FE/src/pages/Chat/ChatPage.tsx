import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../utils/storage';
import { ROLE_ID } from '../../constants/roles';
import {
  getRoomsByUser,
  getMessages,
  sendMessageRest,
} from '../../services/api/ChatService';
import type {
  ChatRoomDTO,
  ChatMessageDTO,
  SendMessageRequest,
} from '../../services/api/ChatService';
import {
  getApartmentDetailByPost,
  getPostImages,
  getPostById,
} from '../../services/api/PostManagementService';
import type {
  HinhAnhBaiDangDTO,
} from '../../services/api/PostManagementService';
import { StompClient } from '../../utils/stomp';
import { Send, ArrowLeft, Image, Search, MessageSquare } from 'lucide-react';
import './ChatPage.css';

interface ApartmentSnippet {
  price?: number;
  area?: number;
  ward?: string;
  coverImage?: string;
  title?: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetRoomId = searchParams.get('room');

  // Thông tin user hiện tại
  const session = getAuthSession();
  const currentUserId = session?.user.maNguoiDung || '';
  const currentUserRole = session?.roleId || '';

  // State quản lý phòng chat và tin nhắn
  const [rooms, setRooms] = useState<ChatRoomDTO[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoomDTO[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoomDTO | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Attachment (đính kèm ảnh URL)
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInputBar, setShowImageInputBar] = useState(false);

  // Apartment details state cho room đang chọn
  const [apartmentDetails, setApartmentDetails] = useState<ApartmentSnippet | null>(null);

  // Quản lý WebSocket và Subscription
  const stompClientRef = useRef<StompClient | null>(null);
  const activeSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Phân biệt layout Admin hay Client
  const isAdminLayout = location.pathname.startsWith('/admin');

  // Đảm bảo chỉ người dùng đã đăng nhập mới xem được
  useEffect(() => {
    if (!session) {
      navigate('/login', { state: { from: location } });
    }
  }, [session, navigate, location]);

  // Khởi tạo WebSocket Connection khi component mount
  useEffect(() => {
    if (!currentUserId) return;

    // Connect to Spring Boot WebSocket STOMP
    const wsUrl = 'ws://localhost:8082/ws-chat';
    const client = new StompClient(wsUrl);
    stompClientRef.current = client;

    client.connect(
      () => {
        console.log('STOMP connected successfully to', wsUrl);
      },
      (err) => {
        console.error('STOMP connection error:', err);
      }
    );

    return () => {
      if (activeSubscriptionRef.current) {
        activeSubscriptionRef.current.unsubscribe();
      }
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
    };
  }, [currentUserId]);

  // Tải danh sách phòng chat
  const loadRooms = async () => {
    if (!currentUserId) return;
    try {
      setLoadingRooms(true);
      const roomsData = await getRoomsByUser(currentUserId);
      setRooms(roomsData);
      setFilteredRooms(roomsData);

      // Nếu có room ID được truyền qua URL query (?room=...), kích hoạt phòng đó luôn
      if (targetRoomId) {
        const target = roomsData.find((r) => r.maPhongChat === targetRoomId);
        if (target) {
          handleSelectRoom(target);
        } else {
          // Trường hợp room ID không có trong danh sách nhưng được truyền (VD: vừa tạo phòng từ post detail)
          try {
            // Lấy lại danh sách một lần nữa hoặc đợi
            const freshRooms = await getRoomsByUser(currentUserId);
            const freshTarget = freshRooms.find((r) => r.maPhongChat === targetRoomId);
            if (freshTarget) {
              setRooms(freshRooms);
              setFilteredRooms(freshRooms);
              handleSelectRoom(freshTarget);
            }
          } catch (e) {
            console.error('Không tải được phòng chỉ định', e);
          }
        }
      }
    } catch (error) {
      console.error('Không thể tải danh sách phòng chat:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [currentUserId, targetRoomId]);

  // Bộ lọc danh sách phòng chat theo tên người nhận
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = rooms.filter((r) => {
      const otherUserName = getOtherPartyName(r).toLowerCase();
      const apartmentTitle = r.tieuDeBaiDang?.toLowerCase() || '';
      return otherUserName.includes(term) || apartmentTitle.includes(term);
    });
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);

  // Tự động cuộn xuống dưới cùng của danh sách tin nhắn khi có tin nhắn mới
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Đăng ký nhận tin nhắn WebSocket real-time khi chuyển phòng
  const subscribeToRoom = (roomId: string) => {
    // Huỷ đăng ký phòng cũ trước
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
    }

    if (!stompClientRef.current) return;

    const destination = `/topic/chat-room/${roomId}`;
    console.log(`Subscribing to topic: ${destination}`);

    const sub = stompClientRef.current.subscribe(destination, (frame) => {
      try {
        const newMsg = JSON.parse(frame.body) as ChatMessageDTO;
        console.log('Received WebSocket message:', newMsg);

        setMessages((prev) => {
          // Tránh trùng lặp tin nhắn nếu tin nhắn gửi đi đã được cập nhật local
          if (prev.some((m) => m.maTinNhan === newMsg.maTinNhan)) return prev;
          return [...prev, newMsg];
        });

        // Cập nhật tin nhắn cuối cùng trên danh sách phòng
        setRooms((prevRooms) =>
          prevRooms.map((r) => {
            if (r.maPhongChat === roomId) {
              return {
                ...r,
                tinNhanCuoi: newMsg.noiDung,
                thoiGianTinNhanCuoi: newMsg.thoiGianGui,
              };
            }
            return r;
          })
        );
      } catch (err) {
        console.error('Lỗi phân giải tin nhắn WebSocket:', err);
      }
    });

    activeSubscriptionRef.current = sub;
  };

  // Lựa chọn phòng để chat
  const handleSelectRoom = async (room: ChatRoomDTO) => {
    setActiveRoom(room);
    setLoadingMessages(true);
    setApartmentDetails(null);
    setSearchParams({ room: room.maPhongChat });

    try {
      // 1. Tải lịch sử tin nhắn
      const history = await getMessages(room.maPhongChat);
      setMessages(history);

      // 2. Đăng ký WebSocket nhận tin nhắn real-time
      subscribeToRoom(room.maPhongChat);

      // 3. Tải thông tin chi tiết bài viết (nếu có đính kèm căn hộ)
      if (room.maBaiDang) {
        loadApartmentSnippet(room.maBaiDang);
      }
    } catch (error) {
      console.error('Lỗi khi mở phòng chat:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Tải chi tiết căn hộ để hiển thị Horizontal Card
  const loadApartmentSnippet = async (maBaiDang: string) => {
    try {
      const [detailRes, imagesRes, postRes] = await Promise.all([
        getApartmentDetailByPost(maBaiDang).catch(() => null),
        getPostImages(maBaiDang).catch(() => [] as HinhAnhBaiDangDTO[]),
        getPostById(maBaiDang).catch(() => null),
      ]);

      const snippet: ApartmentSnippet = {
        title: postRes?.tieuDe || 'Thông tin căn hộ',
        price: detailRes?.gia,
        area: detailRes?.dienTich,
        ward: detailRes?.phuong,
        coverImage: imagesRes[0]?.thumbnailUrl || imagesRes[0]?.duongDan,
      };

      setApartmentDetails(snippet);
    } catch (e) {
      console.error('Không tải được thông tin snippet căn hộ:', e);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content && !imageUrlInput.trim()) return;
    if (!activeRoom) return;

    setSending(true);

    const payload: SendMessageRequest = {
      maPhongChat: activeRoom.maPhongChat,
      maNguoiGui: currentUserId,
      noiDung: content || 'Đã gửi một hình ảnh',
      loaiTinNhan: imageUrlInput.trim() ? 'IMAGE' : 'TEXT',
      tepDinhKemUrl: imageUrlInput.trim() || null,
    };

    try {
      // Ưu tiên gửi qua WebSocket
      if (stompClientRef.current && stompClientRef.current.isConnected()) {
        stompClientRef.current.send('/app/chat.send', payload);
        // Reset inputs
        setMessageInput('');
        setImageUrlInput('');
        setShowImageInputBar(false);
      } else {
        // Fallback gửi qua REST API
        console.warn('STOMP offline, falling back to REST API');
        const savedMsg = await sendMessageRest(payload);
        setMessages((prev) => [...prev, savedMsg]);

        // Cập nhật lại tin nhắn cuối
        setRooms((prevRooms) =>
          prevRooms.map((r) => {
            if (r.maPhongChat === activeRoom.maPhongChat) {
              return {
                ...r,
                tinNhanCuoi: savedMsg.noiDung,
                thoiGianTinNhanCuoi: savedMsg.thoiGianGui,
              };
            }
            return r;
          })
        );
        setMessageInput('');
        setImageUrlInput('');
        setShowImageInputBar(false);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      alert('Không thể gửi tin nhắn. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setSending(false);
    }
  };

  // Trợ giúp phân biệt đối phương trò chuyện
  const isUser1 = (room: ChatRoomDTO) => room.maNguoiDung1 === currentUserId;

  const getOtherPartyName = (room: ChatRoomDTO) => {
    return isUser1(room) ? room.tenNguoiDung2 : room.tenNguoiDung1;
  };

  const getOtherPartyRoleLabel = (room: ChatRoomDTO) => {
    if (room.loaiPhongChat === 'USER_ADMIN') {
      // Đối phương là Admin nếu tôi không phải Admin, ngược lại đối phương là Người thuê
      return currentUserRole === ROLE_ID.ADMIN ? 'Khách hàng' : 'Ban quản trị';
    }
    return 'Chủ nhà / Khách';
  };

  // Format thời gian tin nhắn
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatFullDate = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  // Nút quay lại danh sách trên mobile
  const handleBackToSidebar = () => {
    setActiveRoom(null);
    setSearchParams({});
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
    }
  };

  return (
    <div className={`chat-container ${isAdminLayout ? 'admin-chat-container' : ''} ${activeRoom ? 'room-selected' : ''}`}>
      {/* Sidebar - Cột bên trái */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Tin nhắn</h2>
          <div className="chat-search-wrap">
            <Search className="chat-search-icon" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc căn hộ..."
              className="chat-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-room-list">
          {loadingRooms ? (
            <div className="chat-empty-state">
              <p>Đang tải danh sách phòng...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="chat-empty-state">
              <MessageSquare className="chat-empty-icon" style={{ animation: 'none' }} />
              <h3>Chưa có hội thoại</h3>
              <p>Danh sách tin nhắn trống. Bạn có thể liên hệ chủ nhà tại trang căn hộ!</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = activeRoom?.maPhongChat === room.maPhongChat;
              const otherName = getOtherPartyName(room);
              const otherInitial = otherName ? otherName.charAt(0).toUpperCase() : '?';
              const roleLabel = getOtherPartyRoleLabel(room);

              return (
                <div
                  key={room.maPhongChat}
                  className={`chat-room-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="chat-avatar">
                    {otherInitial}
                    <span className="chat-online-badge"></span>
                  </div>
                  <div className="chat-room-info">
                    <div className="chat-room-top">
                      <span className="chat-room-name">{otherName}</span>
                      <span className="chat-room-time">
                        {formatTime(room.thoiGianTinNhanCuoi || room.ngayTao)}
                      </span>
                    </div>
                    <div className="chat-room-bottom">
                      <p className="chat-room-last-msg">
                        {room.tinNhanCuoi || 'Chưa có tin nhắn'}
                      </p>
                      <span className={`chat-room-badge ${room.loaiPhongChat === 'USER_ADMIN' ? 'chat-room-badge--admin' : 'chat-room-badge--host'}`}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Khung Chat chính - Cột bên phải */}
      <main className="chat-window">
        {activeRoom ? (
          <>
            {/* Header phòng chat */}
            <div className="chat-window-header">
              <div className="chat-header-user">
                <button className="chat-back-btn" onClick={handleBackToSidebar}>
                  <ArrowLeft size={22} />
                </button>
                <div className="chat-avatar">
                  {getOtherPartyName(activeRoom)?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="chat-header-meta">
                  <h3>{getOtherPartyName(activeRoom)}</h3>
                  <span>{getOtherPartyRoleLabel(activeRoom)} • Đang hoạt động</span>
                </div>
              </div>
            </div>

            {/* Premium horizontal card đính kèm căn hộ */}
            {apartmentDetails && (
              <div className="chat-post-card">
                <div className="chat-post-details">
                  {apartmentDetails.coverImage ? (
                    <img
                      src={apartmentDetails.coverImage}
                      alt={apartmentDetails.title}
                      className="chat-post-img"
                    />
                  ) : (
                    <div className="chat-post-img" style={{ background: '#e2e8f0' }} />
                  )}
                  <div className="chat-post-text">
                    <h4 className="chat-post-title">{apartmentDetails.title}</h4>
                    <div className="chat-post-meta">
                      <span className="chat-post-price">
                        {apartmentDetails.price
                          ? `${apartmentDetails.price.toLocaleString('vi-VN')}đ/tháng`
                          : 'Liên hệ'}
                      </span>
                      <span>•</span>
                      <span>{apartmentDetails.area ? `${apartmentDetails.area}m²` : 'Đang cập nhật'}</span>
                      <span>•</span>
                      <span>{apartmentDetails.ward || 'Đà Nẵng'}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`/posts/${activeRoom.maBaiDang}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-post-view-btn"
                >
                  Xem chi tiết
                </a>
              </div>
            )}

            {/* Khung tin nhắn */}
            <div className="chat-messages-container">
              {loadingMessages ? (
                <div className="chat-empty-state">
                  <p>Đang tải lịch sử trò chuyện...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-state">
                  <MessageSquare className="chat-empty-icon" />
                  <h3>Bắt đầu cuộc trò chuyện</h3>
                  <p>Hãy gửi lời chào đầu tiên tới đối phương để bắt đầu thảo luận!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.maNguoiGui === currentUserId;
                  const showAuthor = !isMe && activeRoom.loaiPhongChat === 'USER_ADMIN';

                  return (
                    <div key={msg.maTinNhan || index} className={`chat-msg-row ${isMe ? 'sent' : 'received'}`}>
                      <div className="chat-msg-bubble">
                        {showAuthor && <span className="chat-msg-author">{msg.tenNguoiGui}</span>}
                        
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.noiDung}</p>

                        {msg.tepDinhKemUrl && (
                          <img
                            src={msg.tepDinhKemUrl}
                            alt="Ảnh đính kèm"
                            className="chat-msg-image"
                            onClick={() => window.open(msg.tepDinhKemUrl!, '_blank')}
                          />
                        )}

                        <div className="chat-msg-meta" title={formatFullDate(msg.thoiGianGui)}>
                          <span>{formatTime(msg.thoiGianGui)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Thanh nhập liệu */}
            <div className="chat-input-area">
              {showImageInputBar && (
                <div className="chat-image-preview-bar">
                  <Image size={18} className="chat-image-preview-thumbnail" style={{ color: '#6366f1' }} />
                  <input
                    type="text"
                    placeholder="Dán URL hình ảnh muốn gửi tại đây..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.82rem',
                    }}
                  />
                  <button
                    type="button"
                    className="chat-image-preview-cancel"
                    onClick={() => {
                      setImageUrlInput('');
                      setShowImageInputBar(false);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <button
                  type="button"
                  className="chat-attach-btn"
                  title="Gửi hình ảnh bằng link"
                  onClick={() => setShowImageInputBar((prev) => !prev)}
                >
                  <Image size={20} />
                </button>

                <div className="chat-input-wrap">
                  <input
                    type="text"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    className="chat-composer-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sending}
                  />
                </div>

                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={sending || (!messageInput.trim() && !imageUrlInput.trim())}
                >
                  <span>Gửi</span>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <MessageSquare size={44} style={{ color: '#ffffff' }} />
            </div>
            <h3>Khung trò chuyện thời gian thực</h3>
            <p>Vui lòng chọn một hội thoại ở cột bên trái để bắt đầu nhắn tin trao đổi!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
