import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClientLayout from './DashboardClientLayout'
import PendingApproval from './components/PendingApproval'
import { getAppSettings, getCompletedOrdersStats, getWorkers, getFilaments, getPrinters } from '@/actions'
import type { Order, Profile } from '@/types'

export default async function DashboardPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: errorMessage } = await props.searchParams

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
    .single<Profile>()

  const isAdmin = profile?.role === 'admin'

  
  if (!isAdmin && profile?.is_approved !== true) {
    return <PendingApproval userEmail={user.email || ''} />
  }

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  const orders: Order[] = ordersData || []

  
  const ordersWithUrls: Order[] = orders.map(o => {
    const inQueue = o.status !== 'completed'
    return {
      ...o,
      file_url: inQueue && o.file_path ? `/api/files/${o.id}/file` : null,
      image_url: inQueue && o.image_path ? `/api/files/${o.id}/image` : null,
    }
  })

  const [settings, filaments, printers, statsOrders, workers] = await Promise.all([
    getAppSettings(),
    getFilaments(),
    getPrinters(),
    getCompletedOrdersStats(),
    isAdmin ? getWorkers() : Promise.resolve([]),
  ])

  return (
    <DashboardClientLayout
      userEmail={user.email || ''}
      profile={profile}
      initialOrders={ordersWithUrls}
      initialWorkers={workers}
      initialSettings={settings}
      initialFilaments={filaments}
      initialPrinters={printers}
      statsOrders={statsOrders}
      errorMessage={errorMessage}
    />
  )
}
