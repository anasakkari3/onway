'use client';

import { useState, useEffect, useRef } from 'react';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { MessageWithSender } from '@/lib/types';
import { sendMessage } from './actions';

type Props = { tripId: string; initialMessages: MessageWithSender[] };

export default function ChatRoom({ tripId, initialMessages }: Props) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const q = query(
      collection(db, 'messages'),
      where('trip_id', '==', tripId),
      orderBy('created_at', 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: MessageWithSender[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sender: null,
        })) as MessageWithSender[];
        setMessages(msgs);
      },
      (err) => {
        console.warn('Chat subscription error (likely security rules):', err.message);
      }
    );
    return () => unsubscribe();
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
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {m.sender?.display_name ?? t('someone')} · {new Date(m.created_at).toLocaleTimeString()}
            </span>
            <span className="text-slate-900 dark:text-slate-100">{m.content}</span>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('type_message')}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sky-600 dark:bg-sky-500 px-4 py-2 text-white font-medium disabled:opacity-50"
        >
          {t('send')}
        </button>
      </form>
    </div>
  );
}
