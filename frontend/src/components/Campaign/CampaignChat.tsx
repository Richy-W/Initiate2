import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface CampaignChatProps {
  campaignId: string;
}

const CampaignChat: React.FC<CampaignChatProps> = ({ campaignId }) => {
  const authState = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.hostname}:8000`;
    const ws = new WebSocket(`${host}/ws/campaign/${campaignId}/chat/?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch {
        // ignore
      }
    };

    wsRef.current = ws;
    return () => { ws.close(); };
  }, [campaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: 'chat', text: input.trim() }));
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col" style={{ height: '400px' }}>
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">Campaign Chat</h3>
        <span className={`text-xs ${connected ? 'text-green-600' : 'text-gray-400'}`}>
          {connected ? '● Connected' : '○ Offline'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === authState.user?.username ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg px-3 py-1.5 text-sm ${msg.sender === authState.user?.username ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {msg.sender !== authState.user?.username && (
                <div className="text-xs font-medium mb-0.5 opacity-70">{msg.sender}</div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          disabled={!connected}
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CampaignChat;
