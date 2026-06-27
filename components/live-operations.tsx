'use client'

import { useState, useEffect } from 'react'
import { NewShipmentModal } from '@/components/new-shipment-modal'

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

interface LiveOperationsProps {
  shipments: Shipment[]
  refetch?: () => void
}

const statusConfig: Record<string, { label: string; color: string }> = {
  in_transit: { label: 'On Time', color: 'bg-emerald-500/10 text-emerald-400' },
  delayed:    { label: 'Delayed',  color: 'bg-amber-500/10 text-amber-400' },
}

export function LiveOperations({ shipments, refetch }: LiveOperationsProps) {
  const [showModal, setShowModal] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])

  useEffect(() => {
    fetch('/api/drivers')
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch(() => {})
  }, [])

  const handleCreate = () => {
    setShowModal(false)
    refetch?.()
  }

  const activeShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'delayed',
  )

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Active Shipments</h3>
      </div>

      <div className="flex-1 space-y-2 p-4 overflow-y-auto max-h-[420px]">
        {activeShipments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active shipments
          </p>
        ) : (
          activeShipments.map((shipment) => {
            const cfg = statusConfig[shipment.status] ?? statusConfig.in_transit
            return (
              <div
                key={shipment.id}
                className="p-3 rounded-lg bg-muted/30 border border-border hover:border-border/80 hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-mono text-xs font-semibold text-foreground">
                    {shipment.id.slice(0, 8)}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {shipment.driver_name ?? 'Unassigned'} · {shipment.origin} → {shipment.destination}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-foreground">{shipment.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      shipment.status === 'delayed'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    }`}
                    style={{ width: `${shipment.progress}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-3 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + New Shipment
        </button>
        <a
          href="/dashboard/fleet-management"
          className="block w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground text-center"
        >
          View All
        </a>
      </div>

      {showModal && (
        <NewShipmentModal
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}