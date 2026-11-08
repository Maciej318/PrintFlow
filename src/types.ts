

export type Tab = 'kolejka' | 'dodaj' | 'historia' | 'statystyki' | 'admin'

export type OrderStatus = 'pending' | 'printing' | 'completed' | 'failed'

export interface Profile {
  id: string
  email: string
  role: string
  is_approved: boolean | null
  created_at?: string
}

export interface Worker {
  id: string
  email: string
  role: string
  is_approved: boolean
}

export interface AppSettings {
  cost_per_hour: number
}

export interface Filament {
  id: string
  name: string
  cost_per_gram: number
}

export interface Printer {
  id: string
  name: string
}

export interface Order {
  id: string
  created_at: string
  user_id?: string
  model_name: string
  file_path: string
  image_path: string | null
  quantity: number
  estimated_cost: number
  status: string
  due_date: string
  notes: string | null
  hours: number | null
  weight_g: number | null
  filament_id: string | null
  filament_name: string | null
  printer_id: string | null
  printer_name: string | null
  is_priority: boolean
  image_url?: string | null
  file_url?: string | null
}

export interface CompletedOrderStat {
  id: string
  due_date: string
  estimated_cost: number
  quantity: number
  hours: number
}

export interface ActionResult {
  success: boolean
  error?: string
}
