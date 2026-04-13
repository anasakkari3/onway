import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full border-[3px] border-sky-400/40 border-t-sky-500 animate-spin" />
            </div>
          }
        >
          <VerifyClient />
        </Suspense>
      </div>
    </div>
  );
}
