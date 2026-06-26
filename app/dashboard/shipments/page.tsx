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

export default async function ShipmentsPage() {
  const shipments = await query<ShipmentRow>(
    `SELECT s.id, s.driver_id, d.name AS driver_name,
            s.origin, s.destination, s.status, s.progress,
            s.created_at, s.updated_at
     FROM shipments s
     LEFT JOIN drivers d ON d.id = s.driver_id
     ORDER BY s.created_at DESC`,
  )

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {shipments.length} total
          </span>
        </div>
        <ActivityTable shipments={shipments} />
      </div>
    </main>
  )
}