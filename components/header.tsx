'use client'

import { Bell, Search } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-card/95 backdrop-blur border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Breadcrumbs and Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Dashboard</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground">Overview</span>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-sm px-4 py-2 bg-muted rounded-lg border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shipments, drivers, or IDs..."
            className="bg-transparent flex-1 outline-none text-sm placeholder-muted-foreground"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-4">
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-foreground hidden sm:inline">
              System Operational
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
