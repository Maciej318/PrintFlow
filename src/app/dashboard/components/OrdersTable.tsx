'use client'

import { updateOrderStatus, deleteOrder, toggleOrderPriority, assignOrderPrinter } from '@/actions'
import { Download, FileText, Trash2, Star, Search } from 'lucide-react'
import { useTransition, useState, useEffect, useMemo } from 'react'
import type { Order, Printer } from '@/types'

interface OrdersTableProps {
  orders: Order[]
  showFullColumns: boolean
  printers?: Printer[]
  
  isAdmin?: boolean
}

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: 'Oczekujący', class: 'bg-warning-100 text-warning-700 border-warning-200' },
  printing: { label: 'Drukuje się', class: 'bg-brand-100 text-brand-700 border-brand-200' },
  completed: { label: 'Zrealizowany', class: 'bg-success-100 text-success-700 border-success-200' },
  failed: { label: 'Błąd', class: 'bg-danger-100 text-danger-700 border-danger-200' }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function OrdersTable({ orders, showFullColumns, printers = [] }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition()
  const [localOrders, setLocalOrders] = useState<Order[]>(orders)

  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [printerFilter, setPrinterFilter] = useState('')

  useEffect(() => {
    setLocalOrders(orders)
  }, [orders])

  
  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = showFullColumns
      ? localOrders.filter(o =>
          (!q || o.model_name.toLowerCase().includes(q) || (o.filament_name ?? '').toLowerCase().includes(q)) &&
          (!statusFilter || o.status === statusFilter) &&
          (!printerFilter || (printerFilter === 'none' ? !o.printer_id : o.printer_id === printerFilter))
        )
      : localOrders

    return [...filtered].sort((a, b) => {
      if (!showFullColumns) return b.created_at.localeCompare(a.created_at)
      const byPriority = Number(!!b.is_priority) - Number(!!a.is_priority)
      if (byPriority !== 0) return byPriority
      const byDue = a.due_date.localeCompare(b.due_date)
      if (byDue !== 0) return byDue
      return a.created_at.localeCompare(b.created_at)
    })
  }, [localOrders, showFullColumns, search, statusFilter, printerFilter])

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
      } catch (error) {
        alert('Wystąpił nieoczekiwany błąd połączenia: ' + errorText(error))
        setLocalOrders(previousOrders)
      }
    })
  }

  const handleTogglePriority = (orderId: string, current: boolean) => {
    const previousOrders = [...localOrders]
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_priority: !current } : o))

    startTransition(async () => {
      try {
        const result = await toggleOrderPriority(orderId, !current)
        if (!result || !result.success) {
          alert('Nie udało się zmienić priorytetu: ' + (result?.error || 'Błąd serwera'))
          setLocalOrders(previousOrders)
        }
      } catch (error) {
        alert('Wystąpił błąd połączenia: ' + errorText(error))
        setLocalOrders(previousOrders)
      }
    })
  }

  const handleAssignPrinter = (orderId: string, printerId: string) => {
    const previousOrders = [...localOrders]
    const printer = printers.find(p => p.id === printerId) ?? null

    setLocalOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, printer_id: printer?.id ?? null, printer_name: printer?.name ?? null } : o
    ))

    startTransition(async () => {
      try {
        const result = await assignOrderPrinter(orderId, printer?.id ?? null)
        if (!result || !result.success) {
          alert('Nie udało się przypisać drukarki: ' + (result?.error || 'Błąd serwera'))
          setLocalOrders(previousOrders)
        }
      } catch (error) {
        alert('Wystąpił błąd połączenia: ' + errorText(error))
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
      } catch (error) {
        alert('Wystąpił błąd połączenia: ' + errorText(error))
        setLocalOrders(previousOrders)
      }
    })
  }

  const columnCount = showFullColumns ? 9 : 6

  return (
    <div className="space-y-4">

      {showFullColumns && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po nazwie lub filamencie"
              aria-label="Szukaj zleceń"
              className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtr statusu"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Wszystkie statusy</option>
            {Object.entries(statusMap)
              .filter(([key]) => key !== 'completed')
              .map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
          </select>

          <select
            value={printerFilter}
            onChange={(e) => setPrinterFilter(e.target.value)}
            aria-label="Filtr drukarki"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Wszystkie drukarki</option>
            <option value="none">Nieprzypisane</option>
            {printers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-400">
            {visibleOrders.length} z {localOrders.length}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th className="py-4 px-4">Nazwa</th>
              {showFullColumns && <th className="py-4 px-4">Filament</th>}
              {showFullColumns && <th className="py-4 px-4">Drukarka</th>}
              {showFullColumns && <th className="py-4 px-4">Podgląd</th>}
              <th className="py-4 px-4">Koszt wydruku</th>
              <th className="py-4 px-4">Ilość</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">{showFullColumns ? 'Termin (Deadline)' : 'Zakończono'}</th>
              <th className="py-4 px-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">

            {visibleOrders.map(order => (
              <tr
                key={order.id}
                className={`transition ${order.is_priority && showFullColumns ? 'bg-warning-50/60 hover:bg-warning-50' : 'hover:bg-slate-50/50'}`}
              >

                <td className="py-4 px-4 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    {showFullColumns ? (
                      <button
                        onClick={() => handleTogglePriority(order.id, !!order.is_priority)}
                        disabled={isPending}
                        title={order.is_priority ? 'Zdejmij priorytet' : 'Oznacz jako pilne'}
                        aria-label={order.is_priority ? 'Zdejmij priorytet' : 'Oznacz jako pilne'}
                        aria-pressed={!!order.is_priority}
                        className="p-1 rounded-md hover:bg-warning-100 transition cursor-pointer disabled:opacity-40"
                      >
                        <Star className={`w-5 h-5 ${order.is_priority ? 'text-warning-500 fill-warning-400' : 'text-slate-300'}`} />
                      </button>
                    ) : order.is_priority ? (
                      <Star className="w-4 h-4 text-warning-500 fill-warning-400" />
                    ) : null}
                    <span>{order.model_name}</span>
                  </div>
                </td>

                {showFullColumns && (
                  <td className="py-4 px-4 text-slate-600">
                    <div>{order.filament_name || '—'}</div>
                    {order.weight_g != null && (
                      <div className="text-xs text-slate-400">{order.weight_g} g</div>
                    )}
                  </td>
                )}

                {showFullColumns && (
                  <td className="py-4 px-4">
                    <select
                      value={order.printer_id ?? ''}
                      disabled={isPending}
                      onChange={(e) => handleAssignPrinter(order.id, e.target.value)}
                      aria-label={`Drukarka dla zlecenia ${order.model_name}`}
                      className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 cursor-pointer outline-none focus:border-brand-500 max-w-[10rem]"
                    >
                      <option value="">— brak —</option>
                      {printers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                )}

                {showFullColumns && (
                  <td className="py-4 px-4">
                    {order.image_url ? (
                      
                      <img
                        src={order.image_url}
                        alt={`Podgląd: ${order.model_name}`}
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
                    aria-label={`Status zlecenia ${order.model_name}`}
                    className={`px-2 py-1.5 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all duration-200 ${
                      statusMap[order.status]?.class || 'bg-slate-100 text-slate-700 border-slate-200'
                    } ${isPending ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-95'}`}
                  >
                    {Object.entries(statusMap).map(([key, s]) => (
                      <option key={key} value={key} className="bg-white text-slate-900 font-normal">{s.label}</option>
                    ))}
                  </select>
                </td>

                <td className="py-4 px-4 font-medium text-slate-600">
                  {showFullColumns ? order.due_date : new Date(order.created_at).toLocaleDateString('pl-PL')}
                </td>

                <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">

                      {showFullColumns && order.notes && (
                        <div className="relative group flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning-50 hover:bg-warning-100 text-warning-700 font-medium text-xs rounded-lg border border-warning-200 transition cursor-help">
                            <FileText className="w-4 h-4 text-warning-600" />
                            <span>Uwagi</span>
                          </div>

                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-slate-950 text-white text-xs rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                            <div className="font-bold text-warning-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Uwagi do wydruku:
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed font-normal text-slate-200 break-words">
                              {order.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {order.file_url && (
                        <a
                          href={order.file_url}
                          download={order.model_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium text-xs rounded-lg border border-brand-200 transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Pobierz STL
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteOrder(order.id, order.model_name)}
                        disabled={isPending}
                        className="inline-flex items-center justify-center p-2 text-danger-600 hover:text-white hover:bg-danger-600 border border-danger-100 hover:border-danger-600 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Usuń zlecenie"
                        aria-label="Usuń zlecenie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
              </tr>
            ))}
            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="text-center py-12 text-slate-400">Brak zleceń.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
