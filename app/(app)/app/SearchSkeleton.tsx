export default function SearchSkeleton() {
    return (
        <div className="space-y-6 w-full mt-4 animate-fade-in-up">
            <div className="space-y-3">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mx-1 animate-pulse"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm h-[150px] relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 dark:via-slate-800/50 to-transparent"></div>
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                    <div className="space-y-2">
                                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                        <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            </div>
                            <div className="space-y-3 mt-4">
                                <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
