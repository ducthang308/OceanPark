import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useLocation } from 'react-router-dom';

import { ROLE_ID } from '../../../constants/roles';
import type { RoleId } from '../../../constants/roles';
import { getAuthSession } from '../../../utils/storage';
import './ChatBox.css';

type ChatRoleId = typeof ROLE_ID.NGUOI_THUE | typeof ROLE_ID.NGUOI_CHO_THUE;

type ChatMessage = {
  id: string;
  sender: 'me' | 'other';
  content: string;
  time: string;
};

type ConversationSeed = {
  id: string;
  name: string;
  roleLabel: string;
  status: string;
  unread: number;
  messages: ChatMessage[];
};

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 640;
const LAUNCHER_SIZE = 64;
const SCREEN_MARGIN = 16;
const MOBILE_MARGIN = 12;
const POSITION_STORAGE_KEY = 'oceanPark.chatbox.position';

const CHAT_ROLE_IDS = [ROLE_ID.NGUOI_THUE, ROLE_ID.NGUOI_CHO_THUE] as const;

const ROLE_CONVERSATIONS: Record<ChatRoleId, ConversationSeed[]> = {
  [ROLE_ID.NGUOI_THUE]: [
    {
      id: 'tenant-owner',
      name: 'Chủ nhà Ocean Park',
      roleLabel: 'Người cho thuê',
      status: 'Đang trực tuyến',
      unread: 2,
      messages: [
        {
          id: 'tenant-owner-1',
          sender: 'other',
          content: 'Chào bạn, mình có thể hỗ trợ thông tin phòng, lịch xem nhà và đặt cọc.',
          time: '09:10',
        },
        {
          id: 'tenant-owner-2',
          sender: 'me',
          content: 'Mình muốn hỏi phòng còn trống cuối tuần này không?',
          time: '09:12',
        },
        {
          id: 'tenant-owner-3',
          sender: 'other',
          content: 'Còn lịch xem vào chiều thứ bảy. Bạn muốn mình giữ khung 15:00 không?',
          time: '09:13',
        },
      ],
    },
    {
      id: 'tenant-support',
      name: 'Tư vấn thuê nhà',
      roleLabel: 'Hỗ trợ',
      status: 'Phản hồi trong vài phút',
      unread: 0,
      messages: [
        {
          id: 'tenant-support-1',
          sender: 'other',
          content: 'Bạn cần lọc căn hộ theo ngân sách hay khu vực nào?',
          time: '08:45',
        },
      ],
    },
  ],
  [ROLE_ID.NGUOI_CHO_THUE]: [
    {
      id: 'landlord-tenant-1',
      name: 'Nguyễn Minh Anh',
      roleLabel: 'Người thuê',
      status: 'Vừa nhắn tin',
      unread: 1,
      messages: [
        {
          id: 'landlord-tenant-1-1',
          sender: 'other',
          content: 'Em muốn xem căn hộ 2 phòng ngủ trong hôm nay, anh/chị còn lịch không ạ?',
          time: '10:02',
        },
        {
          id: 'landlord-tenant-1-2',
          sender: 'me',
          content: 'Còn lịch 17:30. Em xác nhận giúp anh/chị số người đi xem nhé.',
          time: '10:05',
        },
      ],
    },
    {
      id: 'landlord-tenant-2',
      name: 'Lê Hoàng Nam',
      roleLabel: 'Người thuê',
      status: 'Đang chờ phản hồi',
      unread: 0,
      messages: [
        {
          id: 'landlord-tenant-2-1',
          sender: 'other',
          content: 'Tiền cọc và phí dịch vụ của phòng này được tính thế nào?',
          time: 'Hôm qua',
        },
      ],
    },
  ],
};

const isChatRoleId = (roleId?: RoleId | null): roleId is ChatRoleId =>
  CHAT_ROLE_IDS.includes(roleId as ChatRoleId);

const getWidgetSize = (isOpen: boolean) => {
  if (!isOpen) {
    return {
      width: LAUNCHER_SIZE,
      height: LAUNCHER_SIZE,
    };
  }

  return {
    width: Math.min(PANEL_WIDTH, window.innerWidth - MOBILE_MARGIN * 2),
    height: Math.min(PANEL_HEIGHT, window.innerHeight - MOBILE_MARGIN * 2),
  };
};

const clampPosition = (position: Position, isOpen: boolean): Position => {
  const margin = window.innerWidth <= 576 ? MOBILE_MARGIN : SCREEN_MARGIN;
  const size = getWidgetSize(isOpen);
  const maxX = Math.max(margin, window.innerWidth - size.width - margin);
  const maxY = Math.max(margin, window.innerHeight - size.height - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
};

const readStoredPosition = (): Position | null => {
  try {
    const rawPosition = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!rawPosition) return null;

    const parsed = JSON.parse(rawPosition) as Partial<Position>;
    if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
      return {
        x: Number(parsed.x),
        y: Number(parsed.y),
      };
    }
  } catch {
    localStorage.removeItem(POSITION_STORAGE_KEY);
  }

  return null;
};

const getDefaultPosition = (isOpen: boolean): Position => {
  const size = getWidgetSize(isOpen);

  return {
    x: window.innerWidth - size.width - 24,
    y: window.innerHeight - size.height - 24,
  };
};

const getInitialPosition = (isOpen: boolean) =>
  clampPosition(readStoredPosition() ?? getDefaultPosition(isOpen), isOpen);

const getTimeLabel = () =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';

  return `${first}${last}`.toUpperCase();
};

const createMessageMap = (conversations: ConversationSeed[]) =>
  conversations.reduce<Record<string, ChatMessage[]>>((acc, conversation) => {
    acc[conversation.id] = [...conversation.messages];
    return acc;
  }, {});

const getCurrentChatRole = (): ChatRoleId | null => {
  const session = getAuthSession();
  return isChatRoleId(session?.roleId) ? session.roleId : null;
};

const ChatBox = () => {
  const location = useLocation();
  const [roleId, setRoleId] = useState<ChatRoleId | null>(getCurrentChatRole);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>(() => getInitialPosition(false));
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState('');

  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversations = useMemo(
    () => (roleId ? ROLE_CONVERSATIONS[roleId] : []),
    [roleId],
  );
  const unreadTotal = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0,
  );

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    conversations[0];

  const activeMessages = activeConversation
    ? messagesByConversation[activeConversation.id] ?? activeConversation.messages
    : [];

  useEffect(() => {
    setRoleId(getCurrentChatRole());
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleStorage = () => setRoleId(getCurrentChatRole());

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!roleId) {
      setIsOpen(false);
      setActiveConversationId('');
      setMessagesByConversation({});
      setDraft('');
      return;
    }

    const nextConversations = ROLE_CONVERSATIONS[roleId];
    setActiveConversationId(nextConversations[0]?.id ?? '');
    setMessagesByConversation(createMessageMap(nextConversations));
    setDraft('');
  }, [roleId]);

  useEffect(() => {
    const handleResize = () => setPosition((current) => clampPosition(current, isOpen));

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    setPosition((current) => clampPosition(current, isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeConversationId, activeMessages.length, isOpen]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.hypot(deltaX, deltaY) > 4) {
      dragState.moved = true;
    }

    setPosition(
      clampPosition(
        {
          x: dragState.originX + deltaX,
          y: dragState.originY + deltaY,
        },
        isOpen,
      ),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    suppressClickRef.current = dragState.moved;
    dragStateRef.current = null;

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleLauncherClick = () => {
    if (suppressClickRef.current) return;
    setIsOpen(true);
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !activeConversation) return;

    const nextMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      sender: 'me',
      content,
      time: getTimeLabel(),
    };

    setMessagesByConversation((current) => ({
      ...current,
      [activeConversation.id]: [
        ...(current[activeConversation.id] ?? activeConversation.messages),
        nextMessage,
      ],
    }));
    setDraft('');
  };

  if (!roleId) return null;

  const style: CSSProperties = {
    left: position.x,
    top: position.y,
  };

  if (!isOpen) {
    return (
      <div className="floating-chat" style={style}>
        <button
          type="button"
          className="floating-chat__launcher"
          aria-label="Mở chat"
          aria-expanded={isOpen}
          onClick={handleLauncherClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <i className="fa-solid fa-comments" aria-hidden="true"></i>
          {unreadTotal > 0 && <span className="floating-chat__badge">{unreadTotal}</span>}
        </button>
      </div>
    );
  }

  return (
    <section className="floating-chat floating-chat--open" style={style} aria-label="Chat">
      <div className="floating-chat__panel">
        <header
          className="floating-chat__header"
          title="Kéo để di chuyển"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="floating-chat__title">
            <span className="floating-chat__drag-icon" aria-hidden="true">
              <i className="fa-solid fa-grip-vertical"></i>
            </span>
            <span>
              <strong>Tin nhắn</strong>
              <small>
                {roleId === ROLE_ID.NGUOI_THUE ? 'Người thuê' : 'Người cho thuê'}
              </small>
            </span>
          </div>

          <button
            type="button"
            className="floating-chat__icon-button"
            aria-label="Thu nhỏ chat"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setIsOpen(false)}
          >
            <i className="fa-solid fa-minus" aria-hidden="true"></i>
          </button>
        </header>

        <div className="floating-chat__body">
          <aside className="floating-chat__conversations" aria-label="Danh sách hội thoại">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;
              const unreadCount = isActive ? 0 : conversation.unread;

              return (
                <button
                  type="button"
                  key={conversation.id}
                  className={`floating-chat__conversation ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <span className="floating-chat__avatar">{getInitials(conversation.name)}</span>
                  <span className="floating-chat__conversation-meta">
                    <strong>{conversation.name}</strong>
                    <small>{conversation.roleLabel}</small>
                  </span>
                  {unreadCount > 0 && (
                    <span className="floating-chat__unread">{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </aside>

          <div className="floating-chat__thread">
            {activeConversation && (
              <>
                <div className="floating-chat__thread-header">
                  <div>
                    <strong>{activeConversation.name}</strong>
                    <small>{activeConversation.status}</small>
                  </div>
                  <span className="floating-chat__online-dot" aria-hidden="true"></span>
                </div>

                <div className="floating-chat__messages" aria-live="polite">
                  {activeMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`floating-chat__message floating-chat__message--${message.sender}`}
                    >
                      <p>{message.content}</p>
                      <time>{message.time}</time>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form className="floating-chat__composer" onSubmit={handleSendMessage}>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Nhập tin nhắn..."
                    aria-label="Nhập tin nhắn"
                  />
                  <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim()}>
                    <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatBox;
