/**
 * WebSocket client for real-time combat updates.
 */

type MessageHandler = (data: any) => void;

export class CombatWebSocketClient {
  private ws: WebSocket | null = null;
  private trackerId: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(trackerId: string) {
    this.trackerId = trackerId;
  }

  connect(): void {
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.hostname}:8000`;
    const url = `${host}/ws/combat/${this.trackerId}/?token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handlers.forEach(h => h(data));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }

  send(action: string, payload: Record<string, any> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export function createCombatWebSocket(trackerId: string): CombatWebSocketClient {
  return new CombatWebSocketClient(trackerId);
}

export default CombatWebSocketClient;
