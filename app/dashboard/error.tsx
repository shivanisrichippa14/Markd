'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
        >
          Something went wrong
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {error.message ?? 'An unexpected error occurred while loading your dashboard.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl text-white font-medium transition-all"
          style={{ background: 'var(--accent)' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
