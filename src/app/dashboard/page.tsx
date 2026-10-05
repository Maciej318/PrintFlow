import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClientLayout from './DashboardClientLayout'
import { getAppSettings, getCompletedOrdersStats, getWorkers } from '@/actions'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/')
  }

  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

 
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  let workers: any[] = []
  let settings = { cost_per_gram: 0.15, cost_per_hour: 2.50 }

  if (profile && profile.role === 'admin') {
    workers = await getWorkers()
    settings = await getAppSettings()
  }

  const statsOrders = await getCompletedOrdersStats()

  return (
    <DashboardClientLayout 
      userEmail={user.email || ''} 
      profile={profile} 
      initialOrders={orders || []}
      initialWorkers={workers}
      initialSettings={settings}
      statsOrders={statsOrders}
    />
  )
}