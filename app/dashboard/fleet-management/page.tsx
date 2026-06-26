import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ActivityTable } from '@/components/activity-table'
import { query } from '@/lib/db'

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

export default async function FleetManagementPage() {
  const shipments = await query<ShipmentRow>(
    `SELECT s.id, s.driver_id, d.name AS driver_name,
            s.origin, s.destination, s.status, s.progress,
            s.created_at, s.updated_at
     FROM shipments s
     LEFT JOIN drivers d ON d.id = s.driver_id
     ORDER BY s.updated_at DESC`,
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-0 pt-16 md:pt-0 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Fleet Management</h1>
            <ActivityTable shipments={shipments} />
          </div>
        </main>
      </div>
    </div>
  )
}