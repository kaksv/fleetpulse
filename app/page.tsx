import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { KPICards } from '@/components/kpi-cards'
import { LiveOperations } from '@/components/live-operations'
import { ActivityTable } from '@/components/activity-table'

export default function Page() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-0 pt-16 md:pt-0 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* KPI Metrics */}
            <KPICards />

            {/* Live Operations */}
            <LiveOperations />

            {/* Recent Activity Table */}
            <ActivityTable />
          </div>
        </main>
      </div>
    </div>
  )
}
