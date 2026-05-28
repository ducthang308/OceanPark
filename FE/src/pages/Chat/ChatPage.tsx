import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../utils/storage';
import { ROLE_ID } from '../../constants/roles';
import {
  getRoomsByUser,
  getMessages,
  sendMessageRest,
  uploadChatImage,
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
import { useChatNotifications } from '../../contexts/ChatNotificationProvider';
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

  const {
    stompClient,
    isConnected,
    recentRooms,
    markAllAsRead,
    markRoomAsRead,
    loadRooms: loadGlobalRooms,
  } = useChatNotifications();

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
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);

  // Apartment details state cho room đang chọn
  const [apartmentDetails, setApartmentDetails] = useState<ApartmentSnippet | null>(null);

  // Quản lý Subscription cho phòng hiện tại
  const activeSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const activeSubscriptionRoomIdRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessageDTO[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const stickToBottomRef = useRef(true);
  const selectRoomRequestRef = useRef(0);
  const pendingClickedRoomIdRef = useRef<string | null>(null);

  // Phân biệt layout Admin hay Client
  const isAdminLayout = location.pathname.startsWith('/admin');

  // Đảm bảo chỉ người dùng đã đăng nhập mới xem được
  useEffect(() => {
    if (!session) {
      navigate('/login', { state: { from: location } });
    }
  }, [session, navigate, location]);

  useEffect(() => {
    markAllAsRead();
    window.dispatchEvent(new Event('chat-opened'));
  }, [markAllAsRead]);

  // Cleanup subscription khi component unmount
  useEffect(() => {
    return () => {
      if (activeSubscriptionRef.current) {
        activeSubscriptionRef.current.unsubscribe();
      }
      activeSubscriptionRoomIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  // Tải danh sách phòng chat
  const loadRooms = async () => {
    if (!currentUserId) return;
    try {
      setLoadingRooms(true);
      const roomsData = await getRoomsByUser(currentUserId);
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error) {
      console.error('Không thể tải danh sách phòng chat:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || recentRooms.length === 0) return;
    setRooms(recentRooms);
  }, [currentUserId, recentRooms]);

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

  // Smart scroll: chỉ bám đáy khi người dùng đang đọc gần cuối hội thoại.
  const isNearBottom = (threshold = 160): boolean => {
    if (!messagesContainerRef.current) return true;
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  const handleMessagesScroll = () => {
    stickToBottomRef.current = isNearBottom();
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messageEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useLayoutEffect(() => {
    const pendingBehavior = pendingScrollBehaviorRef.current;

    if (pendingBehavior) {
      scrollToBottom(pendingBehavior);
      pendingScrollBehaviorRef.current = null;
      stickToBottomRef.current = true;
      return;
    }

    if (stickToBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [messages.length, loadingMessages]);

  useEffect(() => {
    if (!latestMessageId) return;

    const timer = window.setTimeout(() => {
      setLatestMessageId(null);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [latestMessageId]);

  const appendMessage = (newMsg: ChatMessageDTO, forceScroll = false) => {
    if (messagesRef.current.some((msg) => msg.maTinNhan === newMsg.maTinNhan)) return;

    const shouldScroll = forceScroll || newMsg.maNguoiGui === currentUserId || isNearBottom();
    if (shouldScroll) {
      pendingScrollBehaviorRef.current =
        forceScroll || newMsg.maNguoiGui === currentUserId ? 'smooth' : 'auto';
    }

    const nextMessages = [...messagesRef.current, newMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setLatestMessageId(newMsg.maTinNhan);
  };

  // Đăng ký nhận tin nhắn WebSocket real-time khi chuyển phòng
  const subscribeToRoom = (roomId: string) => {
    if (activeSubscriptionRoomIdRef.current === roomId && activeSubscriptionRef.current) {
      return;
    }

    // Huỷ đăng ký phòng cũ trước
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
    }
    activeSubscriptionRoomIdRef.current = null;

    if (!stompClient) {
      console.warn('STOMP client is not ready, cannot subscribe to room');
      return;
    }

    const destination = `/topic/chat-room/${roomId}`;
    console.log(`Subscribing to room: ${destination}`);

    const sub = stompClient.subscribe(destination, (frame) => {
      try {
        const newMsg = JSON.parse(frame.body) as ChatMessageDTO;
        console.log('Received WebSocket message:', newMsg);

        if (
          activeSubscriptionRoomIdRef.current !== roomId ||
          newMsg.maPhongChat !== roomId
        ) {
          return;
        }

        appendMessage(newMsg);

        // Cập nhật tin nhắn cuối cùng trên danh sách phòng
        setRooms((prevRooms) => {
          const nextRooms = prevRooms.map((r) => {
            if (r.maPhongChat === roomId) {
              return {
                ...r,
                tinNhanCuoi: newMsg.noiDung,
                thoiGianTinNhanCuoi: newMsg.thoiGianGui,
              };
            }
            return r;
          });

          return [...nextRooms].sort((a, b) => {
            const timeA = new Date(a.thoiGianTinNhanCuoi || a.ngayTao || 0).getTime();
            const timeB = new Date(b.thoiGianTinNhanCuoi || b.ngayTao || 0).getTime();
            return timeB - timeA;
          });
        });
      } catch (err) {
        console.error('Lỗi phân giải tin nhắn WebSocket:', err);
      }
    });

    activeSubscriptionRef.current = sub;
    activeSubscriptionRoomIdRef.current = roomId;
  };

  // Lựa chọn phòng để chat
  const handleSelectRoom = async (room: ChatRoomDTO) => {
    const requestId = selectRoomRequestRef.current + 1;
    selectRoomRequestRef.current = requestId;
    pendingClickedRoomIdRef.current = room.maPhongChat;

    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
      activeSubscriptionRoomIdRef.current = null;
    }

    setActiveRoom(room);
    setLoadingMessages(true);
    setApartmentDetails(null);
    setLatestMessageId(null);
    messagesRef.current = [];
    pendingScrollBehaviorRef.current = 'auto';
    setMessages([]);
    clearSelectedImage();
    markRoomAsRead(room.maPhongChat);
    setSearchParams({ room: room.maPhongChat }, { replace: true });

    try {
      // 1. Tải lịch sử tin nhắn
      const history = await getMessages(room.maPhongChat);
      if (selectRoomRequestRef.current !== requestId) return;

      messagesRef.current = history;
      pendingScrollBehaviorRef.current = 'auto';
      setLatestMessageId(null);
      setMessages(history);

      // 2. Tải thông tin chi tiết bài viết (nếu có đính kèm căn hộ)
      if (room.maBaiDang) {
        void loadApartmentSnippet(room.maBaiDang, requestId);
      }
    } catch (error) {
      if (selectRoomRequestRef.current === requestId) {
        console.error('Lỗi khi mở phòng chat:', error);
      }
    } finally {
      if (selectRoomRequestRef.current === requestId) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    if (!targetRoomId || loadingRooms) return;

    if (pendingClickedRoomIdRef.current) {
      if (targetRoomId === pendingClickedRoomIdRef.current) {
        pendingClickedRoomIdRef.current = null;
      }

      return;
    }

    if (activeRoom?.maPhongChat === targetRoomId) return;

    const target = rooms.find((room) => room.maPhongChat === targetRoomId);
    if (target) {
      void handleSelectRoom(target);
    }
  }, [targetRoomId, rooms, loadingRooms, activeRoom?.maPhongChat]);

  useEffect(() => {
    if (!activeRoom || loadingMessages) return;
    subscribeToRoom(activeRoom.maPhongChat);
  }, [activeRoom?.maPhongChat, isConnected, stompClient, loadingMessages]);

  // Tải chi tiết căn hộ để hiển thị Horizontal Card
  const loadApartmentSnippet = async (maBaiDang: string, requestId: number) => {
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

      if (selectRoomRequestRef.current === requestId) {
        setApartmentDetails(snippet);
      }
    } catch (e) {
      if (selectRoomRequestRef.current === requestId) {
        console.error('Không tải được thông tin snippet căn hộ:', e);
      }
    }
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl(null);
  };

  const handleSelectImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn đúng file ảnh.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 10MB.');
      return;
    }

    setSelectedImageFile(file);
    setSelectedImagePreviewUrl(URL.createObjectURL(file));
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content && !selectedImageFile) return;
    if (!activeRoom) return;

    setSending(true);

    try {
      const imageFileToUpload = selectedImageFile;
      let uploadedImageUrl: string | null = null;

      if (imageFileToUpload) {
        const attachment = await uploadChatImage(imageFileToUpload);
        uploadedImageUrl = attachment.url;
      }

      const payload: SendMessageRequest = {
        maPhongChat: activeRoom.maPhongChat,
        maNguoiGui: currentUserId,
        noiDung: content || 'Đã gửi một hình ảnh',
        loaiTinNhan: uploadedImageUrl ? 'IMAGE' : 'TEXT',
        tepDinhKemUrl: uploadedImageUrl,
      };

      // Ưu tiên gửi qua WebSocket
      pendingScrollBehaviorRef.current = 'smooth';
      const sentBySocket =
        stompClient &&
        isConnected &&
        stompClient.isConnected() &&
        stompClient.send('/app/chat.send', payload);

      if (sentBySocket) {
        // Reset inputs
        setMessageInput('');
        clearSelectedImage();
      } else {
        // Fallback gửi qua REST API
        console.warn('STOMP offline, falling back to REST API');
        const savedMsg = await sendMessageRest(payload);
        appendMessage(savedMsg, true);

        // Cập nhật lại tin nhắn cuối
        setRooms((prevRooms) => {
          const nextRooms = prevRooms.map((r) => {
            if (r.maPhongChat === activeRoom.maPhongChat) {
              return {
                ...r,
                tinNhanCuoi: savedMsg.noiDung,
                thoiGianTinNhanCuoi: savedMsg.thoiGianGui,
              };
            }
            return r;
          });

          return [...nextRooms].sort((a, b) => {
            const timeA = new Date(a.thoiGianTinNhanCuoi || a.ngayTao || 0).getTime();
            const timeB = new Date(b.thoiGianTinNhanCuoi || b.ngayTao || 0).getTime();
            return timeB - timeA;
          });
        });
        setMessageInput('');
        clearSelectedImage();
      }

      void loadGlobalRooms();
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
    selectRoomRequestRef.current += 1;
    pendingClickedRoomIdRef.current = null;
    setActiveRoom(null);
    setLoadingMessages(false);
    setApartmentDetails(null);
    setLatestMessageId(null);
    messagesRef.current = [];
    setMessages([]);
    clearSelectedImage();
    setSearchParams({});
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
      activeSubscriptionRoomIdRef.current = null;
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
            <div
              className="chat-messages-container"
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
            >
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
                    <div
                      key={msg.maTinNhan || index}
                      className={`chat-msg-row ${isMe ? 'sent' : 'received'} ${
                        latestMessageId === msg.maTinNhan ? 'chat-msg-row--new' : ''
                      }`}
                    >
                      <div className="chat-msg-bubble">
                        {showAuthor && <span className="chat-msg-author">{msg.tenNguoiGui}</span>}
                        
                        {!(msg.loaiTinNhan === 'IMAGE' && msg.noiDung === 'Đã gửi một hình ảnh') && (
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.noiDung}</p>
                        )}

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
              {selectedImageFile && selectedImagePreviewUrl && (
                <div className="chat-image-preview-bar">
                  <img
                    src={selectedImagePreviewUrl}
                    alt={selectedImageFile.name}
                    className="chat-image-preview-thumbnail"
                  />
                  <div className="chat-image-preview-info">
                    <span className="chat-image-preview-name">{selectedImageFile.name}</span>
                    <span className="chat-image-preview-size">
                      {(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    className="chat-image-preview-cancel"
                    onClick={clearSelectedImage}
                    disabled={sending}
                    aria-label="Bỏ ảnh đã chọn"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="chat-file-input"
                  onChange={handleSelectImageFile}
                />
                <button
                  type="button"
                  className="chat-attach-btn"
                  title="Chọn ảnh từ thiết bị"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
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
                  disabled={sending || (!messageInput.trim() && !selectedImageFile)}
                >
                  <span>{sending ? 'Đang gửi' : 'Gửi'}</span>
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
