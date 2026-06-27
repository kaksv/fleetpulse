import { query } from '@/lib/db'
import { LiveMapClient } from './client'

interface ShipmentRow {
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

  return <LiveMapClient initialShipments={shipments as Shipment[]} />
}
