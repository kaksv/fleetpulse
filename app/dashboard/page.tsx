import { KPICards } from '@/components/kpi-cards'
import { LiveOperations } from '@/components/live-operations'
import { ActivityTable } from '@/components/activity-table'
import { query } from '@/lib/db'
import { Suspense } from 'react'

interface ShipmentRow extends Record<string, unknown> {
  id: string
  driver_id: string | null
  driver_name: string | null
  origin: string
  destination: string
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
  progress: number
  created_at: string
  updated_at: string
}

interface DriverRow extends Record<string, unknown> {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'offline' | 'on_break'
  active_shipments: number
  created_at: string
  updated_at: string
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="h-4 w-24 bg-muted rounded mb-4" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card h-96" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded mb-3" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-40 bg-muted rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded mb-2" />
        ))}
      </div>
    </div>
  )
}

function DashboardError({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-foreground">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  let shipments: ShipmentRow[] = []
  let drivers: DriverRow[] = []

  try {
    const [s, d] = await Promise.all([
      query<ShipmentRow>(
        `SELECT s.id, s.driver_id, d.name AS driver_name,
                s.origin, s.destination, s.status, s.progress,
                s.created_at, s.updated_at
         FROM shipments s
         LEFT JOIN drivers d ON d.id = s.driver_id
         ORDER BY s.created_at DESC`,
      ),
      query<DriverRow>(
        `SELECT d.id, d.name, d.email, d.phone, d.status,
                (SELECT COUNT(*) FROM shipments s WHERE s.driver_id = d.id AND s.status = 'in_transit') AS active_shipments,
                d.created_at, d.updated_at
         FROM drivers d
         ORDER BY d.name ASC`,
      ),
    ])
    shipments = s
    drivers = d
  } catch (error) {
    return <DashboardError error={error instanceof Error ? error : new Error('Unknown error')} />
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<DashboardSkeleton />}>
          <KPICards shipments={shipments} drivers={drivers} />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <LiveOperations shipments={shipments} />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <ActivityTable shipments={shipments} />
        </Suspense>
      </div>
    </main>
  )
}