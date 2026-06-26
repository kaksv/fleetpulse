import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-0 pt-16 md:pt-0 flex flex-col">
        <Header />
        {children}
      </div>
    </div>
  )
}