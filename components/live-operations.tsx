'use client'

import { Cloud, Eye, ToggleLeft, MapPin } from 'lucide-react'

const shipments = [
  {
    id: '#SHP-8839',
    driver: 'Marcus Chen',
    status: 'On Time',
    progress: 65,
    statusColor: 'bg-emerald-500/20 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: '#SHP-8840',
    driver: 'Sarah Williams',
    status: 'On Time',
    progress: 42,
    statusColor: 'bg-emerald-500/20 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: '#SHP-8841',
    driver: 'James Rodriguez',
    status: 'Delayed',
    progress: 28,
    statusColor: 'bg-amber-500/20 text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: '#SHP-8842',
    driver: 'Emma Thompson',
    status: 'On Time',
    progress: 78,
    statusColor: 'bg-emerald-500/20 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: '#SHP-8843',
    driver: 'David Park',
    status: 'On Time',
    progress: 55,
    statusColor: 'bg-emerald-500/20 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
]

export function LiveOperations() {
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

            {/* Map Pings/Markers */}
            {[
              { x: '20%', y: '30%', label: 'Truck 01' },
              { x: '40%', y: '45%', label: 'Truck 02' },
              { x: '60%', y: '35%', label: 'Truck 03' },
              { x: '75%', y: '60%', label: 'Truck 04' },
              { x: '85%', y: '25%', label: 'Truck 05' },
            ].map((marker, i) => (
              <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2">
                <div style={{ left: marker.x, top: marker.y }} className="absolute">
                  {/* Pulsing ring */}
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500/50 animate-pulse" />
                  {/* Center dot */}
                  <div className="absolute inset-2 w-2 h-2 bg-emerald-500 rounded-full" />
                </div>
              </div>
            ))}

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
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="p-4 rounded-lg bg-muted/30 border border-border hover:border-border/80 hover:bg-muted/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {shipment.id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{shipment.driver}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${shipment.badgeColor}`}>
                  {shipment.status}
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
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600"
                    style={{ width: `${shipment.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground">
          View All
        </button>
      </div>
    </div>
  )
}
