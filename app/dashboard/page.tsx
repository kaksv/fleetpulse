import { DashboardClient } from '@/components/dashboard-client'

export default function DashboardPage() {
  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <DashboardClient />
      </div>
    </main>
  )
}