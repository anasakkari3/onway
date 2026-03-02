import { notFound } from 'next/navigation';
import { getTripById } from '@/lib/services/trip';
import { getMessages } from '@/lib/services/chat';
import ChatRoom from './ChatRoom';

export default async function TripChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let trip;
  let messages;
  try {
    trip = await getTripById(id);
    messages = await getMessages(id);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      <div className="p-2 border-b border-slate-200 bg-white">
        <h1 className="font-medium text-slate-900 truncate">
          Chat: {trip.origin_name} → {trip.destination_name}
        </h1>
      </div>
      <ChatRoom tripId={id} initialMessages={messages ?? []} />
    </div>
  );
}
