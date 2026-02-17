export default function DashboardLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Navbar skeleton */}
      <div
        className="h-16 border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="skeleton h-8 w-28 rounded-xl" />
          <div className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton h-8 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form skeleton */}
        <div
          className="rounded-2xl border p-6 mb-8"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="skeleton h-11 rounded-xl sm:col-span-1" />
            <div className="skeleton h-11 rounded-xl sm:col-span-1" />
            <div className="skeleton h-11 rounded-xl" />
          </div>
        </div>

        {/* Filter skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-36 rounded-xl" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 rounded mb-2" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              </div>
              <div className="skeleton h-3 w-24 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
