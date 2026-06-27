'use client'

import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useState } from 'react'

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

interface ActivityTableProps {
  shipments: Shipment[]
  onDelete?: (id: string) => Promise<void>
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_transit: { label: 'In Transit', color: 'bg-emerald-500/10 text-emerald-400' },
  delivered: { label: 'Delivered', color: 'bg-blue-500/10 text-blue-400' },
  delayed: { label: 'Delayed', color: 'bg-amber-500/10 text-amber-400' },
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function ActivityTable({ shipments, onDelete }: ActivityTableProps) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(shipments.length / itemsPerPage) || 1
  const colSpan = onDelete ? 6 : 5

  const startIdx = (page - 1) * itemsPerPage
  const paginatedShipments = shipments.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-6">Recent Fleet Activity</h3>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Shipment ID
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Route
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Driver
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Last Updated
              </th>
              {onDelete && (
                <th className="w-10 text-left py-3 px-4 font-semibold text-muted-foreground" />
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedShipments.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
                  No shipments found
                </td>
              </tr>
            ) : (
              paginatedShipments.map((shipment) => {
                const cfg = STATUS_MAP[shipment.status] ?? STATUS_MAP.pending
                return (
                  <tr
                    key={shipment.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono font-semibold text-foreground">
                        {shipment.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{shipment.origin}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground">{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {shipment.driver_name ?? 'Unassigned'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {timeAgo(shipment.updated_at)}
                    </td>
                    {onDelete && (
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this shipment?')) {
                              onDelete(shipment.id)
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete shipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages} • {shipments.length} total items
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-foreground">{page}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}