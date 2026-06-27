import { LiveOperations } from '@/components/live-operations'
import { FleetMap } from '@/components/fleet-map'
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

export default async function LiveMapPage() {
  const shipments = await query<ShipmentRow>(
    `SELECT s.id, s.driver_id, d.name AS driver_name,
            s.origin, s.destination, s.status, s.progress,
            s.created_at, s.updated_at
     FROM shipments s
     LEFT JOIN drivers d ON d.id = s.driver_id
     WHERE s.status IN ('in_transit', 'delayed')
     ORDER BY s.updated_at DESC`,
  )

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Live Map</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <FleetMap shipments={shipments} />
          </div>
          <LiveOperations shipments={shipments} />
        </div>
      </div>
    </main>
  )
}