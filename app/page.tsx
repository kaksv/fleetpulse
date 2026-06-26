import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { KPICards } from '@/components/kpi-cards'
import { LiveOperations } from '@/components/live-operations'
import { ActivityTable } from '@/components/activity-table'
import { Suspense } from 'react'

/* ------------------------------------------------------------------ */
/*  Types matching API responses                                       */
/* ------------------------------------------------------------------ */

interface Shipment {
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

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'offline' | 'on_break'
  active_shipments: number
  created_at: string
  updated_at: string
}

interface DashboardData {
  shipments: Shipment[]
  drivers: Driver[]
}

/* ------------------------------------------------------------------ */
/*  Server-side data fetching                                          */
/* ------------------------------------------------------------------ */

async function fetchDashboardData(): Promise<DashboardData> {
  // VERCEL_URL is auto-injected by Vercel; fallback to localhost for dev
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const [shipmentsRes, driversRes] = await Promise.all([
    fetch(`${baseUrl}/api/shipments`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/drivers`, { cache: 'no-store' }),
  ])

  if (!shipmentsRes.ok || !driversRes.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  const [shipments, drivers]: [Shipment[], Driver[]] = await Promise.all([
    shipmentsRes.json(),
    driversRes.json(),
  ])

  return { shipments, drivers }
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-64 bg-sidebar border-r border-sidebar-border animate-pulse" />
      <div className="flex-1 md:ml-0 pt-16 md:pt-0 flex flex-col">
        <div className="h-16 bg-card/95 border-b border-border animate-pulse" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* KPI skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
                  <div className="h-4 w-24 bg-muted rounded mb-4" />
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
            {/* Map + Feed skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 rounded-xl border border-border bg-card h-96 animate-pulse" />
              <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="h-5 w-32 bg-muted rounded mb-4" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded mb-3" />
                ))}
              </div>
            </div>
            {/* Table skeleton */}
            <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
              <div className="h-5 w-40 bg-muted rounded mb-6" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded mb-2" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

function DashboardError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <form>
          <button
            type="submit"
            formAction={async () => {
              'use server'
              // Trigger a re-fetch
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Retry
          </button>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard (Server Component)                                       */
/* ------------------------------------------------------------------ */

export default async function Page() {
  let data: DashboardData

  try {
    data = await fetchDashboardData()
  } catch (error) {
    return <DashboardError error={error instanceof Error ? error : new Error('Unknown error')} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 md:ml-0 pt-16 md:pt-0 flex flex-col">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<DashboardSkeleton />}>
              <KPICards shipments={data.shipments} drivers={data.drivers} />
            </Suspense>

            <Suspense fallback={<DashboardSkeleton />}>
              <LiveOperations shipments={data.shipments} />
            </Suspense>

            <Suspense fallback={<DashboardSkeleton />}>
              <ActivityTable shipments={data.shipments} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}