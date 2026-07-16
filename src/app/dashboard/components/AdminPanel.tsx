'use client'

import { useState, useTransition } from 'react'
import { toggleWorkerApproval, deleteWorker, updateAppSettings } from '@/actions'
import { Shield, Trash2, Check, X, Coins } from 'lucide-react'

interface Worker {
  id: string
  email: string
  role: string
  is_approved: boolean
  created_at: string
}

interface Settings {
  cost_per_gram: number
  cost_per_hour: number
}

interface AdminPanelProps {
  initialWorkers: Worker[]
  initialSettings: Settings
  currentAdminId: string
}

export default function AdminPanel({ initialWorkers, initialSettings, currentAdminId }: AdminPanelProps) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers)
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  // Formularz cenowy
  const [costPerGram, setCostPerGram] = useState(initialSettings.cost_per_gram.toString())
  const [costPerHour, setCostPerHour] = useState(initialSettings.cost_per_hour.toString())
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Zgoda na dostęp (Akceptacja pracownika)
  const handleToggleApproval = (workerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    // Szybka zmiana w UI (optymistyczna)
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_approved: newStatus } : w))

    startTransition(async () => {
      const result = await toggleWorkerApproval(workerId, newStatus)
      if (!result.success) {
        alert('Błąd: ' + result.error)
        // Cofnięcie zmiany w przypadku błędu
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, is_approved: currentStatus } : w))
      }
    })
  }

  // Usuwanie pracownika
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

  // Zapisywanie cennika
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(false)

    startTransition(async () => {
      const gramPrice = parseFloat(costPerGram)
      const hourPrice = parseFloat(costPerHour)

      if (isNaN(gramPrice) || isNaN(hourPrice)) {
        alert('Wprowadź poprawne wartości liczbowe!')
        return
      }

      const result = await updateAppSettings(gramPrice, hourPrice)
      if (result.success) {
        setSettings({ cost_per_gram: gramPrice, cost_per_hour: hourPrice })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert('Błąd zapisu ustawień: ' + result.error)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEWA STRONA: LISTA PRACOWNIKÓW (2/3 szerokości) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" /> Zarządzanie Pracownikami
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
                      worker.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
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
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200/60'
                            : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200/60'
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
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer inline-flex items-center"
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

      {/* PRAWA STRONA: CENNIK (1/3 szerokości) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6 self-start">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Coins className="w-5 h-5 text-amber-500" /> Stawki Wydruków 3D
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Koszt za gram filamentu (zł)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPerGram}
              onChange={(e) => setCostPerGram(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Koszt za godzinę pracy drukarki (zł)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPerHour}
              onChange={(e) => setCostPerHour(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Zapisywanie...' : 'Zapisz stawki'}
          </button>

          {saveSuccess && (
            <p className="text-xs text-emerald-600 font-semibold text-center bg-emerald-50 py-1.5 rounded-lg">
              ✓ Stawki zaktualizowane pomyślnie!
            </p>
          )}
        </form>
      </div>
    </div>
  )
}