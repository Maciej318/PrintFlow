'use client'

import { updateOrderStatus, deleteOrder } from '@/actions';
import { Download, FileText, Trash2 } from 'lucide-react'; 
import { useTransition, useState, useEffect } from 'react';

interface Order {
  id: string
  model_name: string
  file_path: string
  image_path: string | null
  quantity: number
  estimated_cost: number
  status: string
  due_date: string
  created_at: string
  notes?: string | null
}

interface OrdersTableProps {
  orders: Order[]
  showFullColumns: boolean 
}

export default function OrdersTable({ orders, showFullColumns }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition()
  const [localOrders, setLocalOrders] = useState<Order[]>(orders)

  useEffect(() => {
    setLocalOrders(orders)
  }, [orders])

  const statusMap: Record<string, { label: string; class: string }> = {
    pending: { label: 'Oczekujący', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    printing: { label: 'Drukuje się', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Zrealizowany', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    failed: { label: 'Błąd', class: 'bg-red-100 text-red-700 border-red-200' }
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const previousOrders = [...localOrders]

    setLocalOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )

    startTransition(async () => {
      try {
        const result = await updateOrderStatus(orderId, newStatus)
        if (!result || !result.success) {
          alert('Nie udało się zaktualizować statusu: ' + (result?.error || 'Błąd serwera'))
          setLocalOrders(previousOrders)
        }
      } catch (error: any) {
        alert('Wystąpił nieoczekiwany błąd połączenia: ' + error.message)
        setLocalOrders(previousOrders)
      }
    })
  }

  
  const handleDeleteOrder = (orderId: string, modelName: string) => {
    
    if (!confirm(`Czy na pewno chcesz bezpowrotnie usunąć zlecenie: "${modelName}"?`)) {
      return
    }

    const previousOrders = [...localOrders]

    
    setLocalOrders(prev => prev.filter(order => order.id !== orderId))

    startTransition(async () => {
      try {
        const result = await deleteOrder(orderId)
        if (!result || !result.success) {
          alert('Nie udało się usunąć zlecenia: ' + (result?.error || 'Błąd serwera'))
          setLocalOrders(previousOrders) 
        }
      } catch (error: any) {
        alert('Wystąpił błąd połączenia: ' + error.message)
        setLocalOrders(previousOrders)
      }
    })
  }

  const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50">
            <th className="py-4 px-4">Nazwa</th>{showFullColumns && (
              <th className="py-4 px-4">Podgląd</th>
            )}<th className="py-4 px-4">Koszt wydruku</th>
            <th className="py-4 px-4">Ilość</th>
            <th className="py-4 px-4">Status</th>{showFullColumns ? (
              <th className="py-4 px-4">Termin (Deadline)</th>
            ) : (
              <th className="py-4 px-4">Zakończono</th>
            )}{showFullColumns && (
              <th className="py-4 px-4 text-right">Akcje</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          
          {localOrders.map(order => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition">
              
              <td className="py-4 px-4 font-medium text-slate-900">
                {order.model_name}
              </td>
              
              {showFullColumns && (
                <td className="py-4 px-4">
                  {order.image_path ? (
                    <img 
                      src={`${SUPABASE_PROJECT_URL}/storage/v1/object/public/order-files/${order.image_path}`} 
                      alt="Podgląd" 
                      className="w-20 h-12 object-cover rounded-md border border-slate-200 bg-slate-50 shadow-sm" 
                    />
                  ) : (
                    <div className="w-20 h-12 bg-slate-100 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">Brak</div>
                  )}
                </td>
              )}

              <td className="py-4 px-4 font-semibold text-slate-700">{order.estimated_cost.toFixed(2)} zł</td>
              <td className="py-4 px-4 text-slate-600">{order.quantity} szt.</td>
              
              <td className="py-4 px-4">
                <select
                  value={order.status}
                  disabled={isPending}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`px-2 py-1.5 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all duration-200 ${
                    statusMap[order.status]?.class || 'bg-slate-100 text-slate-700 border-slate-200'
                  } ${isPending ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-95'}`}
                >
                  <option value="pending" className="bg-white text-slate-900 font-normal">Oczekujący</option>
                  <option value="printing" className="bg-white text-slate-900 font-normal">Drukuje się</option>
                  <option value="completed" className="bg-white text-slate-900 font-normal">Zrealizowany</option>
                  <option value="failed" className="bg-white text-slate-900 font-normal">Błąd</option>
                </select>
              </td>

              <td className="py-4 px-4 font-medium text-slate-600">
                {showFullColumns ? order.due_date : new Date(order.created_at).toLocaleDateString('pl-PL')}
              </td>

              {showFullColumns && (
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    
                   
                    {order.notes && (
                      <div className="relative group flex items-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-xs rounded-lg border border-amber-200 transition cursor-help">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <span>Uwagi</span>
                        </div>
                        
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-slate-950 text-white text-xs rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Uwagi do wydruku:
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed font-normal text-slate-200 break-words">
                            {order.notes}
                          </p>
                          <div className="absolute top-full right-6 border-4 border-transparent border-t-slate-955" />
                        </div>
                      </div>
                    )}

                 
                    <a 
                      href={`${SUPABASE_PROJECT_URL}/storage/v1/object/public/order-files/${order.file_path}`} 
                      download={order.model_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-lg border border-blue-150 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Pobierz STL
                    </a>

               
                    <button
                      onClick={() => handleDeleteOrder(order.id, order.model_name)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center p-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Usuń zlecenie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </td>
              )}
            </tr>
          ))}
          {localOrders.length === 0 && (
            <tr>
              <td colSpan={showFullColumns ? 7 : 5} className="text-center py-12 text-slate-400">Brak zleceń.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}