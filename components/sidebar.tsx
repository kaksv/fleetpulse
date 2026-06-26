'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutGrid,
  Map,
  Truck,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', icon: LayoutGrid, href: '#', active: true },
  { name: 'Live Map', icon: Map, href: '#' },
  { name: 'Fleet Management', icon: Truck, href: '#' },
  { name: 'Shipments', icon: Package, href: '#' },
  { name: 'Analytics', icon: BarChart3, href: '#' },
  { name: 'Settings', icon: Settings, href: '#' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 md:hidden bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-lg text-sidebar-foreground">
              FleetPulse
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="pt-6 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Alex Johnson
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  Region: US-East
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
