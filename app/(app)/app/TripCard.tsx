import Link from 'next/link';

export function TripCard({ trip, t, lang = 'en' }: { trip: any; t?: (k: any) => string; lang?: string }) {
    return (
        <Link
            href={`/trips/${trip.id}`}
            className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover relative overflow-hidden group animate-fade-in-up"
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800 rounded-bl-[100px] -z-10 group-hover:bg-sky-50 dark:group-hover:bg-slate-800 transition-colors rtl:right-auto rtl:left-0 rtl:rounded-bl-none rtl:rounded-br-[100px]"></div>

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {trip.driver?.avatar_url || trip.avatar_url ? (
                        <img src={trip.driver?.avatar_url || trip.avatar_url} alt="Driver" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[120px]">
                            {trip.driver?.display_name || trip.display_name || (t ? t('driver') : 'Driver')}
                        </p>
                        <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                            ⭐ {(trip.driver?.rating_count || trip.driver_rating_count) ? `${(trip.driver?.rating_avg || trip.driver_rating_avg).toFixed(1)} (${trip.driver?.rating_count || trip.driver_rating_count})` : (t ? t('new') : 'New')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    {trip.price_cents != null && (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">${(trip.price_cents / 100).toFixed(2)}</span>
                    )}
                    {trip.score && trip.score >= 80 && (
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-0.5 uppercase tracking-widest">{t ? t('highly_recommended') || 'Great Match' : 'Great Match'}</span>
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{trip.origin_name}</p>
                </div>
                <div className="ml-1 w-0.5 h-3 bg-slate-200 dark:bg-slate-700 my-0.5"></div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full border-[2px] border-emerald-500 shrink-0"></div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{trip.destination_name}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 rtl:flex-row-reverse">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    {new Date(trip.departure_time).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })} · {new Date(trip.departure_time).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-full">
                    {trip.seats_available} {trip.seats_available !== 1 ? (t ? t('seats_left') : 'seats left') : (t ? t('seat_left') : 'seat left')}
                </span>
            </div>
        </Link>
    );
}
