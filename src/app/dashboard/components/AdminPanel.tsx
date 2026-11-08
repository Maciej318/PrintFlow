'use client'

import { useState, useTransition } from 'react'
import { toggleWorkerApproval, deleteWorker, updateHourlyRate, addFilament, updateFilament, deleteFilament, addPrinter, renamePrinter, deletePrinter } from '@/actions'
import type { AppSettings, Filament, Printer, Worker } from '@/types'
import { Shield, Trash2, Check, X, Coins, Plus, Pencil, Printer as PrinterIcon } from 'lucide-react'

interface AdminPanelProps {
  initialWorkers: Worker[]
  initialSettings: AppSettings
  initialFilaments: Filament[]
  initialPrinters: Printer[]
  currentAdminId: string
}

export default function AdminPanel({ initialWorkers, initialSettings, initialFilaments, initialPrinters, currentAdminId }: AdminPanelProps) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers)
  const [isPending, startTransition] = useTransition()


  const [filaments, setFilaments] = useState<Filament[]>(initialFilaments)
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters)
  const [newPrinter, setNewPrinter] = useState('')
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null)
  const [editPrinterName, setEditPrinterName] = useState('')
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [costPerHour, setCostPerHour] = useState(initialSettings.cost_per_hour.toString())
  const [saveSuccess, setSaveSuccess] = useState(false)

 
  const handleToggleApproval = (workerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_approved: newStatus } : w))

    startTransition(async () => {
      const result = await toggleWorkerApproval(workerId, newStatus)
      if (!result.success) {
        alert('Błąd: ' + result.error)
        
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_approved: currentStatus } : w))
      }
    })
  }


  const handleDeleteWorker = async (workerId: string, email: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć pracownika ${email}? Usunie to trwale jego konto logowania!`)) return

    startTransition(async () => {
      const result = await deleteWorker(workerId)
      if (result.success) {
        setWorkers(prev => prev.filter(w => w.id !== workerId))
      } else {
        alert('Błąd podczas usuwania: ' + result.error)
      }
    })
  }


  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(false)

    startTransition(async () => {
      const hourPrice = parseFloat(costPerHour)

      if (isNaN(hourPrice) || hourPrice < 0) {
        alert('Wprowadź poprawną wartość liczbową!')
        return
      }

      const result = await updateHourlyRate(hourPrice)
      if (result.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert('Błąd zapisu ustawień: ' + result.error)
      }
    })
  }

  const handleAddFilament = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(newPrice)
    if (!newName.trim() || isNaN(price) || price < 0) {
      alert('Podaj nazwę filamentu i poprawną cenę za gram!')
      return
    }

    startTransition(async () => {
      const result = await addFilament(newName, price)
      if (result.success && result.filament) {
        setFilaments(prev => [...prev, result.filament as Filament].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
        setNewPrice('')
      } else {
        alert('Błąd dodawania filamentu: ' + result.error)
      }
    })
  }

  const startEditing = (f: Filament) => {
    setEditingId(f.id)
    setEditName(f.name)
    setEditPrice(f.cost_per_gram.toString())
  }

  const handleSaveFilament = (id: string) => {
    const price = parseFloat(editPrice)
    if (!editName.trim() || isNaN(price) || price < 0) {
      alert('Podaj nazwę filamentu i poprawną cenę za gram!')
      return
    }

    startTransition(async () => {
      const result = await updateFilament(id, editName, price)
      if (result.success) {
        setFilaments(prev => prev.map(f => f.id === id ? { ...f, name: editName.trim(), cost_per_gram: price } : f))
        setEditingId(null)
      } else {
        alert('Błąd zapisu filamentu: ' + result.error)
      }
    })
  }

  const handleDeleteFilament = (f: Filament) => {
    if (!confirm(`Usunąć filament "${f.name}"? Istniejące zlecenia zachowają jego nazwę.`)) return

    startTransition(async () => {
      const result = await deleteFilament(f.id)
      if (result.success) {
        setFilaments(prev => prev.filter(x => x.id !== f.id))
      } else {
        alert('Błąd usuwania filamentu: ' + result.error)
      }
    })
  }

  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrinter.trim()) return

    startTransition(async () => {
      const result = await addPrinter(newPrinter)
      if (result.success && result.printer) {
        setPrinters(prev => [...prev, result.printer as Printer].sort((a, b) => a.name.localeCompare(b.name)))
        setNewPrinter('')
      } else {
        alert('Błąd dodawania drukarki: ' + result.error)
      }
    })
  }

  const handleSavePrinter = (id: string) => {
    if (!editPrinterName.trim()) return

    startTransition(async () => {
      const result = await renamePrinter(id, editPrinterName)
      if (result.success) {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, name: editPrinterName.trim() } : p))
        setEditingPrinterId(null)
      } else {
        alert('Błąd zmiany nazwy drukarki: ' + result.error)
      }
    })
  }

  const handleDeletePrinter = (p: Printer) => {
    if (!confirm(`Usunąć drukarkę "${p.name}"? Zlecenia przypisane do niej zostaną bez drukarki.`)) return

    startTransition(async () => {
      const result = await deletePrinter(p.id)
      if (result.success) {
        setPrinters(prev => prev.filter(x => x.id !== p.id))
      } else {
        alert('Błąd usuwania drukarki: ' + result.error)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
   
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-600" /> Zarządzanie Pracownikami
          </h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            {workers.length} zarejestrowanych
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Email</th>
                <th className="p-4">Rola</th>
                <th className="p-4">Dostęp</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {workers.map(worker => (
                <tr key={worker.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-medium text-slate-900">{worker.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      worker.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {worker.role === 'admin' ? 'ADMIN' : 'PRACOWNIK'}
                    </span>
                  </td>
                  <td className="p-4">
                    {worker.id === currentAdminId ? (
                      <span className="text-xs text-slate-400 italic">Twoje konto</span>
                    ) : (
                      <button
                        onClick={() => handleToggleApproval(worker.id, worker.is_approved)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                          worker.is_approved
                            ? 'bg-success-100 text-success-700 border-success-200 hover:bg-success-200/60'
                            : 'bg-danger-100 text-danger-700 border-danger-200 hover:bg-danger-200/60'
                        }`}
                      >
                        {worker.is_approved ? (
                          <><Check className="w-3.5 h-3.5" /> Aktywny</>
                        ) : (
                          <><X className="w-3.5 h-3.5" /> Zablokowany</>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {worker.id !== currentAdminId && (
                      <button
                        onClick={() => handleDeleteWorker(worker.id, worker.email)}
                        disabled={isPending}
                        className="text-slate-400 hover:text-danger-600 p-2 rounded-lg hover:bg-danger-50 transition cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      <div className="space-y-8 self-start">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Coins className="w-5 h-5 text-warning-500" /> Stawki Wydruków 3D
        </h2>

        {/* Filamenty */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filamenty (cena za gram)
          </h3>

          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {filaments.length === 0 && (
              <li className="p-3 text-xs text-slate-400 text-center">Brak filamentów. Dodaj pierwszy poniżej.</li>
            )}
            {filaments.map(f => (
              <li key={f.id} className="p-2.5 text-sm">
                {editingId === f.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded-md text-sm text-slate-800"
                    />
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-20 px-2 py-1 border border-slate-200 rounded-md text-sm text-slate-800"
                    />
                    <button onClick={() => handleSaveFilament(f.id)} disabled={isPending} className="text-success-600 hover:bg-success-50 p-1.5 rounded-md cursor-pointer" title="Zapisz">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md cursor-pointer" title="Anuluj">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 truncate">{f.name}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-500 text-xs mr-1">{f.cost_per_gram.toFixed(3)} zł/g</span>
                      <button onClick={() => startEditing(f)} className="text-slate-400 hover:text-accent-600 p-1.5 rounded-md hover:bg-accent-50 cursor-pointer" title="Edytuj">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteFilament(f)} disabled={isPending} className="text-slate-400 hover:text-danger-600 p-1.5 rounded-md hover:bg-danger-50 cursor-pointer" title="Usuń">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddFilament} className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="np. PLA czarny"
              className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-800"
            />
            <input
              type="number"
              step="0.001"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="zł/g"
              className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent-600 hover:bg-accent-700 text-white p-2 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              title="Dodaj filament"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        
        <form onSubmit={handleSaveSettings} className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Koszt za godzinę pracy drukarki (zł)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPerHour}
              onChange={(e) => setCostPerHour(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Zapisywanie...' : 'Zapisz stawkę godzinową'}
          </button>

          {saveSuccess && (
            <p className="text-xs text-success-600 font-semibold text-center bg-success-50 py-1.5 rounded-lg">
              ✓ Stawka zaktualizowana pomyślnie!
            </p>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
          <PrinterIcon className="w-5 h-5 text-accent-600" /> Drukarki
        </h2>

        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
          {printers.length === 0 && (
            <li className="p-3 text-xs text-slate-400 text-center">Brak drukarek. Dodaj pierwszą poniżej.</li>
          )}
          {printers.map(p => (
            <li key={p.id} className="p-2.5 text-sm">
              {editingPrinterId === p.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editPrinterName}
                    onChange={(e) => setEditPrinterName(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded-md text-sm text-slate-800"
                  />
                  <button onClick={() => handleSavePrinter(p.id)} disabled={isPending} className="text-success-600 hover:bg-success-50 p-1.5 rounded-md cursor-pointer" title="Zapisz">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingPrinterId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md cursor-pointer" title="Anuluj">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800 truncate">{p.name}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditingPrinterId(p.id); setEditPrinterName(p.name) }} className="text-slate-400 hover:text-accent-600 p-1.5 rounded-md hover:bg-accent-50 cursor-pointer" title="Zmień nazwę">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePrinter(p)} disabled={isPending} className="text-slate-400 hover:text-danger-600 p-1.5 rounded-md hover:bg-danger-50 cursor-pointer" title="Usuń">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddPrinter} className="flex items-center gap-2">
          <input
            value={newPrinter}
            onChange={(e) => setNewPrinter(e.target.value)}
            placeholder="np. Bambu Lab A1 #1"
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-800"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent-600 hover:bg-accent-700 text-white p-2 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            title="Dodaj drukarkę"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}