export interface StompHeaders {
  [key: string]: string;
}

export interface StompFrame {
  command: string;
  headers: StompHeaders;
  body: string;
}

/**
 * Hàm serialize một STOMP frame thành chuỗi gửi đi qua WebSocket
 */
export function serializeFrame(command: string, headers: StompHeaders = {}, body: string = ''): string {
  let frame = command + '\n';
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += '\n'; // Dòng trống ngăn cách headers và body
  frame += body;
  frame += '\u0000'; // Ký tự NULL đánh dấu kết thúc frame STOMP
  return frame;
}

/**
 * Hàm parse chuỗi nhận được từ WebSocket thành danh sách các STOMP frames
 */
export function parseFrames(data: string): StompFrame[] {
  const frames: StompFrame[] = [];
  let index = 0;

  while (index < data.length) {
    // Tìm ký tự NULL đánh dấu kết thúc frame
    const nullIndex = data.indexOf('\u0000', index);
    if (nullIndex === -1) break;

    const rawFrame = data.slice(index, nullIndex).replace(/\r\n/g, '\n');
    index = nullIndex + 1;

    // Bỏ qua ký tự xuống dòng thừa giữa các frames (nếu có)
    const trimmedRaw = rawFrame.trimStart();
    if (!trimmedRaw) continue;

    // Tách phần đầu (Command & Headers) và phần thân (Body)
    const headerEndIndex = trimmedRaw.indexOf('\n\n');
    if (headerEndIndex === -1) {
      // Frame không có body
      const lines = trimmedRaw.split('\n');
      const command = lines[0].trim();
      const headers: StompHeaders = {};
      for (let i = 1; i < lines.length; i++) {
        const colonIndex = lines[i].indexOf(':');
        if (colonIndex !== -1) {
          const key = lines[i].slice(0, colonIndex).trim();
          const value = lines[i].slice(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
      frames.push({ command, headers, body: '' });
    } else {
      const headerPart = trimmedRaw.slice(0, headerEndIndex);
      const body = trimmedRaw.slice(headerEndIndex + 2);

      const lines = headerPart.split('\n');
      const command = lines[0].trim();
      const headers: StompHeaders = {};
      for (let i = 1; i < lines.length; i++) {
        const colonIndex = lines[i].indexOf(':');
        if (colonIndex !== -1) {
          const key = lines[i].slice(0, colonIndex).trim();
          const value = lines[i].slice(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
      frames.push({ command, headers, body });
    }
  }

  return frames;
}

export type MessageCallback = (frame: StompFrame) => void;

interface Subscription {
  id: string;
  destination: string;
  callback: MessageCallback;
}

export class StompClient {
  private url: string;
  private ws: WebSocket | null = null;
  private connected = false;
  private subscriptions = new Map<string, Subscription>();
  private subCounter = 0;
  private onConnectCallback?: () => void;
  private onErrorCallback?: (err: any) => void;
  private onDisconnectCallback?: () => void;
  private reconnectTimeout?: number;
  private isDisconnecting = false;
  private reconnectDelay = 2000;

  constructor(url: string) {
    this.url = url;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Kết nối tới STOMP broker qua WebSocket
   */
  public connect(onConnect?: () => void, onError?: (err: any) => void, onDisconnect?: () => void) {
    this.isDisconnecting = false;
    this.onConnectCallback = onConnect;
    this.onErrorCallback = onError;
    this.onDisconnectCallback = onDisconnect;

    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      if (this.onErrorCallback) this.onErrorCallback(error);
      this.triggerReconnect();
    }
  }

  /**
   * Đăng ký nhận tin từ một topic
   */
  public subscribe(destination: string, callback: MessageCallback): { unsubscribe: () => void } {
    const subId = `sub-${this.subCounter++}`;
    const sub: Subscription = { id: subId, destination, callback };
    this.subscriptions.set(subId, sub);

    // Nếu đang kết nối, gửi SUBSCRIBE frame đi ngay
    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serializeFrame('SUBSCRIBE', { id: subId, destination }));
    }

    return {
      unsubscribe: () => {
        this.subscriptions.delete(subId);
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(serializeFrame('UNSUBSCRIBE', { id: subId }));
        }
      },
    };
  }

  /**
   * Gửi tin nhắn qua STOMP
   */
  public send(destination: string, body: any, headers: StompHeaders = {}): boolean {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('STOMP client is not connected. Message queued or discarded.');
      return false;
    }

    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const mergedHeaders = {
      destination,
      'content-type': 'application/json',
      ...headers,
    };

    this.ws.send(serializeFrame('SEND', mergedHeaders, payload));
    return true;
  }

  /**
   * Ngắt kết nối một cách an toàn
   */
  public disconnect() {
    this.isDisconnecting = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serializeFrame('DISCONNECT'));
    }

    this.connected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  private handleOpen() {
    // Gửi CONNECT frame khi WebSocket mở
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serializeFrame('CONNECT', {
        'accept-version': '1.1,1.2',
        host: window.location.host,
        'heart-beat': '0,0',
      }));
    }
  }

  private handleMessage(event: MessageEvent) {
    const rawData = event.data;
    if (typeof rawData !== 'string') return;

    try {
      const frames = parseFrames(rawData);
      for (const frame of frames) {
        if (frame.command === 'CONNECTED') {
          this.connected = true;
          this.reconnectDelay = 2000; // Reset delay reconnect

          // Tự động subscribe lại tất cả các subscriptions đang lưu
          for (const sub of this.subscriptions.values()) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(serializeFrame('SUBSCRIBE', { id: sub.id, destination: sub.destination }));
            }
          }

          if (this.onConnectCallback) {
            this.onConnectCallback();
          }
        } else if (frame.command === 'MESSAGE') {
          const subId = frame.headers['subscription'];
          const sub = this.subscriptions.get(subId) ?? this.findSubscriptionByDestination(frame);
          if (sub) {
            sub.callback(frame);
          }
        } else if (frame.command === 'ERROR') {
          console.error('STOMP Error Frame received:', frame.headers['message'], frame.body);
          if (this.onErrorCallback) {
            this.onErrorCallback(frame);
          }
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  }

  private findSubscriptionByDestination(frame: StompFrame): Subscription | undefined {
    const destination = frame.headers['destination'];
    if (!destination) return undefined;

    return Array.from(this.subscriptions.values()).find((sub) => sub.destination === destination);
  }

  private handleClose() {
    this.connected = false;

    if (this.isDisconnecting) return;

    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }

    this.triggerReconnect();
  }

  private handleError(err: any) {
    if (this.isDisconnecting) return;

    console.error('STOMP WebSocket error:', err);
    if (this.onErrorCallback) {
      this.onErrorCallback(err);
    }
  }

  private triggerReconnect() {
    if (this.isDisconnecting) return;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Reconnecting to WebSocket at ${this.url}...`);
      // Nhân đôi thời gian chờ cho các lần sau (max 16s)
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 16000);
      this.connect(this.onConnectCallback, this.onErrorCallback, this.onDisconnectCallback);
    }, this.reconnectDelay);
  }
}
