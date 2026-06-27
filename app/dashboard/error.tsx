'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  )
}