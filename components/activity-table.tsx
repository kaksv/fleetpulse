'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const activities = [
  {
    id: '#SHP-8826',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    driver: 'Marcus Chen',
    status: 'On Time',
    updated: '2 hours ago',
    statusColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: '#SHP-8827',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    driver: 'Sarah Williams',
    status: 'On Time',
    updated: '45 minutes ago',
    statusColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: '#SHP-8828',
    origin: 'Houston, TX',
    destination: 'Dallas, TX',
    driver: 'James Rodriguez',
    status: 'Delayed',
    updated: '1 hour ago',
    statusColor: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: '#SHP-8829',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    driver: 'Emma Thompson',
    status: 'On Time',
    updated: '3 hours ago',
    statusColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: '#SHP-8830',
    origin: 'Seattle, WA',
    destination: 'Portland, OR',
    driver: 'David Park',
    status: 'On Time',
    updated: '5 minutes ago',
    statusColor: 'bg-emerald-500/10 text-emerald-400',
  },
]

export function ActivityTable() {
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(activities.length / itemsPerPage)

  const startIdx = (page - 1) * itemsPerPage
  const paginatedActivities = activities.slice(startIdx, startIdx + itemsPerPage)

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
            </tr>
          </thead>
          <tbody>
            {paginatedActivities.map((activity) => (
              <tr
                key={activity.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="py-4 px-4">
                  <span className="font-mono font-semibold text-foreground">
                    {activity.id}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{activity.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{activity.destination}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-foreground">{activity.driver}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.statusColor}`}>
                    {activity.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-muted-foreground">{activity.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages} • {activities.length} total items
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
