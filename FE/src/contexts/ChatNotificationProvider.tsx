import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../services/api/AxiosClient';
import type { ChatRoomDTO } from '../services/api/ChatService';
import { getRoomsByUser } from '../services/api/ChatService';
import { useAuth } from '../hooks/useAuth';
import { StompClient } from '../utils/stomp';

export interface ChatNotification {
  maPhongChat: string;
  maTinNhan: string;
  maNguoiGui?: string;
  tenNguoiGui: string;
  noiDung: string;
  loaiTinNhan: string;
  thoiGianGui: string;
  tieuDeBaiDang?: string;
}

interface ChatNotificationContextType {
  unreadCount: number;
  unreadByRoom: Record<string, number>;
  recentRooms: ChatRoomDTO[];
  recentMessages: ChatNotification[];
  stompClient: StompClient | null;
  isConnected: boolean;
  loadRooms: () => Promise<void>;
  markAllAsRead: () => void;
  markRoomAsRead: (roomId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

interface ChatNotificationProviderProps {
  children: ReactNode;
}

const buildChatWebSocketUrl = () => {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${apiUrl.host}/ws-chat`;
};

const getRoomTime = (room: ChatRoomDTO) =>
  new Date(room.thoiGianTinNhanCuoi || room.ngayTao || 0).getTime();

const sortRoomsByRecentMessage = (rooms: ChatRoomDTO[]) =>
  [...rooms].sort((a, b) => getRoomTime(b) - getRoomTime(a));

const hasNewerRoomMessage = (previousRoom: ChatRoomDTO | undefined, nextRoom: ChatRoomDTO) => {
  if (!previousRoom) return false;

  return getRoomTime(nextRoom) > getRoomTime(previousRoom);
};

const applyNotificationToRooms = (
  rooms: ChatRoomDTO[],
  notification: ChatNotification,
) =>
  sortRoomsByRecentMessage(
    rooms.map((room) => {
      if (room.maPhongChat !== notification.maPhongChat) return room;

      return {
        ...room,
        tinNhanCuoi: notification.noiDung,
        thoiGianTinNhanCuoi: notification.thoiGianGui,
        tieuDeBaiDang: room.tieuDeBaiDang || notification.tieuDeBaiDang,
      };
    }),
  );

const incrementRoomUnread = (state: Record<string, number>, roomId?: string) => {
  if (!roomId) return state;

  return {
    ...state,
    [roomId]: (state[roomId] ?? 0) + 1,
  };
};

export const ChatNotificationProvider: React.FC<ChatNotificationProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.maNguoiDung ?? '';

  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [recentRooms, setRecentRooms] = useState<ChatRoomDTO[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatNotification[]>([]);
  const [stompClient, setStompClient] = useState<StompClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const stompClientRef = useRef<StompClient | null>(null);
  const recentRoomsRef = useRef<ChatRoomDTO[]>([]);
  const loadRoomsRef = useRef<() => Promise<void>>(async () => undefined);

  const loadRooms = useCallback(async () => {
    if (!currentUserId) {
      setRecentRooms([]);
      return;
    }

    try {
      const rooms = await getRoomsByUser(currentUserId);
      const previousRooms = recentRoomsRef.current;
      const previousRoomMap = new Map(
        previousRooms.map((room) => [room.maPhongChat, room]),
      );
      const updatedRooms = sortRoomsByRecentMessage(rooms);
      const isChatPageOpen = window.location.pathname.endsWith('/chat');
      const changedRoomCount =
        previousRooms.length === 0 || isChatPageOpen
          ? 0
          : updatedRooms.filter((room) =>
            hasNewerRoomMessage(previousRoomMap.get(room.maPhongChat), room),
          ).length;

      if (changedRoomCount > 0) {
        setUnreadByRoom((prev) => {
          let next = prev;

          updatedRooms.forEach((room) => {
            if (hasNewerRoomMessage(previousRoomMap.get(room.maPhongChat), room)) {
              next = incrementRoomUnread(next, room.maPhongChat);
            }
          });

          return next;
        });
      }

      setRecentRooms(updatedRooms);
    } catch (error) {
      console.error('Lỗi khi load rooms:', error);
    }
  }, [currentUserId]);

  const markAllAsRead = useCallback(() => {
    setUnreadByRoom({});
  }, []);

  const markRoomAsRead = useCallback((roomId: string) => {
    setUnreadByRoom((prev) => {
      if (!prev[roomId]) return prev;

      const next = { ...prev };
      delete next[roomId];

      return next;
    });
  }, []);

  useEffect(() => {
    recentRoomsRef.current = recentRooms;
  }, [recentRooms]);

  useEffect(() => {
    loadRoomsRef.current = loadRooms;
  }, [loadRooms]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      setUnreadByRoom({});
      setRecentRooms([]);
      setRecentMessages([]);
      setStompClient(null);
      setIsConnected(false);
      return;
    }

    const client = new StompClient(buildChatWebSocketUrl());
    stompClientRef.current = client;
    setStompClient(client);

    const handleNotification = (frame: { body: string }) => {
      try {
        const notification = JSON.parse(frame.body) as ChatNotification;
        const isOwnMessage = notification.maNguoiGui === currentUserId;
        const isChatPageOpen = window.location.pathname.endsWith('/chat');

        setRecentMessages((prev) => [
          notification,
          ...prev.filter((message) => message.maTinNhan !== notification.maTinNhan),
        ].slice(0, 10));

        if (!isOwnMessage && !isChatPageOpen) {
          setUnreadByRoom((prev) => incrementRoomUnread(prev, notification.maPhongChat));
        }

        const knownRoom = recentRoomsRef.current.some(
          (room) => room.maPhongChat === notification.maPhongChat,
        );

        if (knownRoom) {
          setRecentRooms((prevRooms) => applyNotificationToRooms(prevRooms, notification));
        } else {
          void loadRoomsRef.current();
        }
      } catch (error) {
        console.error('Lỗi phân giải notification:', error);
      }
    };

    subscriptionRef.current = client.subscribe(
      `/topic/user/${currentUserId}/chat-notification`,
      handleNotification,
    );

    client.connect(
      () => {
        setIsConnected(true);
        void loadRoomsRef.current();
      },
      () => {
        setIsConnected(false);
      },
      () => {
        setIsConnected(false);
      },
    );

    void loadRooms();

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.disconnect();

      if (stompClientRef.current === client) {
        stompClientRef.current = null;
        setStompClient(null);
      }

      setIsConnected(false);
    };
  }, [currentUserId, isAuthenticated, loadRooms]);

  useEffect(() => {
    window.addEventListener('chat-opened', markAllAsRead);
    return () => window.removeEventListener('chat-opened', markAllAsRead);
  }, [markAllAsRead]);

  const unreadCount = useMemo(
    () => Object.values(unreadByRoom).reduce((total, count) => total + count, 0),
    [unreadByRoom],
  );

  const value = useMemo<ChatNotificationContextType>(
    () => ({
      unreadCount,
      unreadByRoom,
      recentRooms,
      recentMessages,
      stompClient,
      isConnected,
      loadRooms,
      markAllAsRead,
      markRoomAsRead,
    }),
    [
      unreadCount,
      unreadByRoom,
      recentRooms,
      recentMessages,
      stompClient,
      isConnected,
      loadRooms,
      markAllAsRead,
      markRoomAsRead,
    ],
  );

  return (
    <ChatNotificationContext.Provider value={value}>
      {children}
    </ChatNotificationContext.Provider>
  );
};

export const useChatNotifications = (): ChatNotificationContextType => {
  const context = useContext(ChatNotificationContext);

  if (!context) {
    throw new Error('useChatNotifications phải được dùng trong ChatNotificationProvider');
  }

  return context;
};
