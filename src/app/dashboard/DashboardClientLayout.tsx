'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CircleX } from 'lucide-react'
import type { AppSettings, CompletedOrderStat, Filament, Order, Printer, Profile, Tab, Worker } from '@/types'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import OrdersTable from './components/OrdersTable'
import OrderForm from './components/OrderForm'
import AdminPanel from './components/AdminPanel'
import StatsChart from './components/StatsChart'

interface DashboardClientLayoutProps {
  userEmail: string
  profile: Profile | null
  initialOrders: Order[]
  initialWorkers: Worker[]
  initialSettings: AppSettings
  initialFilaments: Filament[]
  initialPrinters: Printer[]
  statsOrders: CompletedOrderStat[]
  errorMessage?: string
}

export default function DashboardClientLayout({
  userEmail,
  profile,
  initialOrders,
  initialWorkers,
  initialSettings,
  initialFilaments,
  initialPrinters,
  statsOrders,
  errorMessage,
}: DashboardClientLayoutProps) {
  
  const [activeTab, setActiveTab] = useState<Tab>(errorMessage ? 'dodaj' : 'kolejka')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const queuedOrders = initialOrders.filter(o => o.status !== 'completed')
  const historyOrders = initialOrders.filter(o => o.status === 'completed')
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">

      <Navbar userEmail={userEmail} role={profile?.role} />

      <div className="flex flex-1">

        <main className="flex-1 p-8">

          {errorMessage && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
              <CircleX className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'kolejka' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Zakolejkowane wydruki</h2>
              <OrdersTable orders={queuedOrders} showFullColumns={true} printers={initialPrinters} isAdmin={isAdmin} />
            </div>
          )}

          {activeTab === 'historia' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Historia zleceń (Zrealizowane)</h2>
              <OrdersTable orders={historyOrders} showFullColumns={false} isAdmin={isAdmin} />
            </div>
          )}

          {activeTab === 'dodaj' && (
            <OrderForm
              filaments={initialFilaments}
              printers={initialPrinters}
              costPerHour={initialSettings.cost_per_hour}
            />
          )}

          {activeTab === 'statystyki' && (
            <StatsChart orders={statsOrders} />
          )}

          {activeTab === 'admin' && isAdmin && profile && (
            <AdminPanel
              initialWorkers={initialWorkers}
              initialSettings={initialSettings}
              initialFilaments={initialFilaments}
              initialPrinters={initialPrinters}
              currentAdminId={profile.id}
            />
          )}

        </main>

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />

      </div>
    </div>
  )
}
