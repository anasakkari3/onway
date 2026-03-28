import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import { TripCard } from './TripCard';

type DiscoveryFeedProps = {
    communityId: string;
    inferredHub: string | null;
    lang: string;
    t: (key: string) => string;
};

export default async function DiscoveryFeed({ communityId, inferredHub, lang, t }: DiscoveryFeedProps) {
    // If we have an inferred hub, run a "Phantom Search".
    // If not, we run a search with empty strings (which returns all scheduled trips ranked purely by time/seats).
    const phantomOrigin = inferredHub || '';
    
    // Execute the search engine passively
    const res = await searchTrips({
        communityId,
        originName: phantomOrigin,
        destinationName: '',
    });

    // In a passive search (destination = ''), ExactMatches are trips that match the hub exactly.
    // Recommendations are trips nearby the hub.
    const allMatches = [...res.exactMatches, ...res.recommendations];

    if (allMatches.length === 0) {
        return (
            <div className="space-y-6 animate-fade-in-up mt-2">
                <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-xl mx-auto mb-3 shadow-sm">🌱</div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{t('no_rides_yet') || 'No rides available yet'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto mb-4">
                        Your community is completely fresh! Be the first to create a trip and kickstart the network.
                    </p>
                    <Link href="/trips/new" className="inline-block rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-5 py-2.5 text-sm font-bold transition-colors btn-press shadow-sm">
                        {t('offer_ride') || 'Offer a Ride'}
                    </Link>
                </div>
            </div>
        );
    }

    // Split logic: highly scored matches vs new general matches
    const recommended = allMatches.filter(trip => trip.score > 0).slice(0, 5);
    const nearbyOrUpcoming = allMatches.filter(trip => trip.score === 0).slice(0, 5);

    // If phantomOrigin exists, display Recommended section.
    // If NO phantomOrigin (brand new cold start), just show everything under "Upcoming Rides".

    return (
        <div className="space-y-8 animate-fade-in-up mt-2">
            
            {/* Contextual Recommendations */}
            {phantomOrigin && recommended.length > 0 && (
                <section className="space-y-3">
                    <div className="px-1 flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('recommended_for_you') || 'Recommended for You'}</h2>
                    </div>
                    <div className="space-y-3">
                        {recommended.map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                    </div>
                </section>
            )}

            {/* General Discovery / Nearby (score = 0) */}
            {nearbyOrUpcoming.length > 0 && (
                <section className="space-y-3 pt-2">
                    <div className="px-1">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {phantomOrigin ? (t('nearby_rides') || 'Other Upcoming Rides') : (t('upcoming_rides') || 'Upcoming Rides')}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {nearbyOrUpcoming.map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                    </div>
                </section>
            )}

            {/* Recently Created - Extracted from the tail end of all matches regardless of score */}
            {allMatches.length > Math.max(recommended.length + nearbyOrUpcoming.length, 3) && (
                <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-1">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('recent_trips') || 'Recently Created'}</h2>
                    </div>
                    <div className="space-y-3 opacity-95">
                        {allMatches.slice(recommended.length + nearbyOrUpcoming.length, recommended.length + nearbyOrUpcoming.length + 5).map(trip => <TripCard key={trip.id} trip={trip} t={t} lang={lang} />)}
                    </div>
                </section>
            )}
            
        </div>
    );
}
