'use client'

import { useState } from 'react'
import { LiveOperations } from '@/components/live-operations'
import dynamic from 'next/dynamic'

// @ts-ignore
const FleetMap = dynamic(() => import('@/components/fleet-map').then((m) => m.FleetMap), { ssr: false })

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

interface LiveMapClientProps {
  initialShipments: unknown[]
}

export function LiveMapClient({ initialShipments }: LiveMapClientProps) {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments as Shipment[])

  const refetch = () => {
    fetch('/api/shipments')
      .then((res) => res.json())
      .then(setShipments)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <FleetMap shipments={shipments} />
        </div>
        <LiveOperations shipments={shipments} refetch={refetch} />
      </div>
    </>
  )
}