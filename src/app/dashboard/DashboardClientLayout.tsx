'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'


import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import OrdersTable from './components/OrdersTable'
import OrderForm from './components/OrderForm'
import AdminPanel from './components/AdminPanel'
import StatsChart from './components/StatsChart'

export default function DashboardClientLayout({ userEmail, profile, initialOrders, initialWorkers, initialSettings, statsOrders }: any) {
  const [activeTab, setActiveTab] = useState<'kolejka' | 'dodaj' | 'historia' | 'statystyki' |'admin'>('kolejka')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }


  const queuedOrders = initialOrders.filter((o: any) => o.status !== 'completed')
  const historyOrders = initialOrders.filter((o: any) => o.status === 'completed')

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      
      
      <Navbar userEmail={userEmail} role={profile?.role} />

      
      <div className="flex flex-1">
        
        
        <main className="flex-1 p-8">
          
          {activeTab === 'kolejka' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Zakolejkowane wydruki</h2>
              <OrdersTable orders={queuedOrders} showFullColumns={true} />
            </div>
          )}

          {activeTab === 'historia' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Historia zleceń (Zrealizowane)</h2>
              <OrdersTable orders={historyOrders} showFullColumns={false} />
            </div>
          )}

          {activeTab === 'dodaj' && (
            <OrderForm 
              costPerGram={initialSettings?.cost_per_gram ?? 0.15} 
              costPerHour={initialSettings?.cost_per_hour ?? 2.50} 
            />
          )}

          {activeTab === 'statystyki' && (
            <StatsChart orders={statsOrders} />
          )}

          {activeTab === 'admin' && profile?.role === 'admin' && (
            <AdminPanel 
              initialWorkers={initialWorkers} 
              initialSettings={initialSettings} 
              currentAdminId={profile.id}
            />
          )}
          
        </main>

        
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={profile?.role === 'admin'} 
          onLogout={handleLogout} 
        />

      </div>
    </div>
  )
}