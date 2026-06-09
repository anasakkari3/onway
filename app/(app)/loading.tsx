/**
 * Instant navigation feedback for every page inside the app shell.
 *
 * Without this file, App Router blocks the whole navigation until the server
 * component finishes all its Firestore queries — the screen appears frozen
 * after a tap. This skeleton renders immediately (the nav stays in place) so
 * navigation feels instant even while data is still loading.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 animate-pulse" aria-hidden="true">
      <div className="sr-only" aria-live="polite">
        Loading…
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-4 w-64 rounded-lg bg-[var(--surface-muted)]" />
      </div>

      {/* Primary action / search bar */}
      <div className="mt-6 h-12 w-full rounded-xl bg-[var(--surface-muted)]" />

      {/* Cards */}
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-32 rounded bg-[var(--surface-muted)]" />
              <div className="h-6 w-16 rounded-full bg-[var(--surface-muted)]" />
            </div>
            <div className="mt-3 h-3 w-3/4 rounded bg-[var(--surface-muted)]" />
            <div className="mt-2 h-3 w-1/2 rounded bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
