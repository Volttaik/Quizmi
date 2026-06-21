"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M8.111 8.111A7.5 7.5 0 0018.364 18.364M3.636 5.636A9.75 9.75 0 0020.364 18.364M1.5 9A10.5 10.5 0 0121 18.75"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re offline</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          No internet connection detected. Some features need connectivity, but previously visited pages are still available.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
