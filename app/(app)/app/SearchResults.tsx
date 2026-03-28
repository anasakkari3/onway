import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import { TripCard } from './TripCard';

type SearchResultsProps = {
    communityId: string;
    originQuery: string;
    destQuery: string;
    lang: string;
    t: (key: string) => string;
};

export default async function SearchResults({ communityId, originQuery, destQuery, lang, t }: SearchResultsProps) {
    const res = await searchTrips({
        communityId,
        originName: originQuery,
        destinationName: destQuery,
    });

    const exactMatches = res.exactMatches;
    const recommendations = res.recommendations;

    // Smart Fallback scenario
    if (exactMatches.length === 0) {
        return (
            <div className="space-y-6 animate-fade-in-up mt-2">
                <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 text-center shadow-sm relative overflow-hidden">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl mx-auto mb-3 relative z-10">📭</div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1 relative z-10">{t('no_perfect_matches') || 'No exact matches found'}</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed max-w-[240px] mx-auto mb-4 relative z-10">
                        We couldn't find a trip matching your exact route. You can create this trip or check recommended alternatives below!
                    </p>
                    <Link href="/trips/new" className="inline-block rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-5 py-2.5 text-sm font-bold transition-colors btn-press shadow-sm relative z-10">
                        {t('create_this_trip') || 'Create this trip'}
                    </Link>
                </div>

                {recommendations.length > 0 && (
                    <section className="space-y-3 pt-2">
                         <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t('recommended_routes') || 'Recommended for You'}</h2>
                         <div className="space-y-3">
                             {recommendations.map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                         </div>
                    </section>
                )}
            </div>
        );
    }

    // Normal Success scenario
    return (
        <div className="space-y-6 animate-fade-in-up mt-2">
            <section className="space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t('best_matches') || 'Best Matches'}</h2>
                <div className="space-y-3">
                    {exactMatches.map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                </div>
            </section>

            {recommendations.length > 0 && (
                <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t('recommended_routes') || 'Recommended for You'}</h2>
                    <div className="space-y-3 opacity-95">
                        {recommendations.map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
