'use client'

import { Cloud, Eye, ToggleLeft, MapPin } from 'lucide-react'

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

interface LiveOperationsProps {
  shipments: Shipment[]
}

export function LiveOperations({ shipments }: LiveOperationsProps) {
  // Only show in-transit and delayed shipments in the live feed
  const activeShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'delayed',
  )

  const statusConfig: Record<string, { label: string; color: string; badgeColor: string }> = {
    in_transit: {
      label: 'On Time',
      color: 'bg-emerald-500/20 text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    delayed: {
      label: 'Delayed',
      color: 'bg-amber-500/20 text-amber-400',
      badgeColor: 'bg-amber-500/20 text-amber-400',
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Map Section */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Map Container with Grid Pattern */}
          <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
            {/* Grid Pattern Background */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Map Pings/Markers — one per active shipment */}
            {activeShipments.slice(0, 5).map((shipment, i) => {
              const positions = [
                { x: '20%', y: '30%' },
                { x: '40%', y: '45%' },
                { x: '60%', y: '35%' },
                { x: '75%', y: '60%' },
                { x: '85%', y: '25%' },
              ]
              const pos = positions[i % positions.length]
              const isDelayed = shipment.status === 'delayed'
              return (
                <div key={shipment.id} className="absolute transform -translate-x-1/2 -translate-y-1/2">
                  <div style={{ left: pos.x, top: pos.y }} className="absolute">
                    {/* Pulsing ring */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 animate-pulse ${
                        isDelayed ? 'border-amber-500/50' : 'border-emerald-500/50'
                      }`}
                    />
                    {/* Center dot */}
                    <div
                      className={`absolute inset-2 w-2 h-2 rounded-full ${
                        isDelayed ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              )
            })}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 bg-card/80 backdrop-blur border border-border rounded-lg p-3 space-y-2">
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted transition-colors text-xs font-medium">
                <Cloud className="w-4 h-4" />
                Traffic
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted transition-colors text-xs font-medium">
                <Cloud className="w-4 h-4" />
                Weather
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted transition-colors text-xs font-medium">
                <Eye className="w-4 h-4" />
                Clusters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Feed */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Active Shipments</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                  className="p-4 rounded-lg bg-muted/30 border border-border hover:border-border/80 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {shipment.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {shipment.driver_name ?? 'Unassigned'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.badgeColor}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">In Transit</span>
                      <span className="text-xs font-semibold text-foreground">
                        {shipment.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${
                          shipment.status === 'delayed'
                            ? 'from-amber-500 to-orange-600'
                            : 'from-emerald-500 to-teal-600'
                        }`}
                        style={{ width: `${shipment.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <button className="w-full mt-4 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground">
          View All
        </button>
      </div>
    </div>
  )
}