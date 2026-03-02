'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from './actions';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { display_name: string | null } | null;
};

type Props = { tripId: string; initialMessages: Message[] };

export default function ChatRoom({ tripId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string; content: string; created_at: string };
          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              sender: null,
            },
          ]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    setLoading(true);
    try {
      await sendMessage(tripId, content);
      setInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ul className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <li key={m.id} className="flex flex-col">
            <span className="text-xs text-slate-500">
              {m.sender?.display_name ?? 'Someone'} · {new Date(m.created_at).toLocaleTimeString()}
            </span>
            <span className="text-slate-900">{m.content}</span>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-white font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
