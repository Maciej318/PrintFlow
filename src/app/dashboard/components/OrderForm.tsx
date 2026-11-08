'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { createOrder } from '@/actions'
import type { Filament, Printer } from '@/types'

interface OrderFormProps {
  filaments: Filament[]
  printers: Printer[]
  costPerHour: number
}

export default function OrderForm({ filaments, printers, costPerHour }: OrderFormProps) {
  const [filamentId, setFilamentId] = useState<string>(filaments[0]?.id ?? '')
  const costPerGram = filaments.find(f => f.id === filamentId)?.cost_per_gram ?? 0
  const [quantity, setQuantity] = useState<number>(1)
  const [weight, setWeight] = useState<number>(0)
  const [hours, setHours] = useState<number>(0)
  const [cost, setCost] = useState<string>('0.00')

  // Automatycznie przeliczamy koszt przy KAŻDEJ zmianie weight, hours, quantity lub stawek
  useEffect(() => {
    const total = ((weight * costPerGram) + (hours * costPerHour)) * quantity
    setCost(total.toFixed(2))
  }, [weight, hours, quantity, costPerGram, costPerHour])

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
        Dodaj nowe zlecenie druku
      </h2>
      
      <form action={createOrder} className="space-y-6">
        
        {/* Nazwa wydruku */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Nazwa wydruku
          </label>
          <input 
            name="model_name" 
            type="text" 
            required 
            placeholder="np. Projekt_budynku.stl" 
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition" 
          />
        </div>

        {/* Kalkulator ze Slicera */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
              Kalkulator danych ze Slicera
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Stawki: {costPerGram.toFixed(2)} zł/g | {costPerHour.toFixed(2)} zł/h
            </span>
          </div>

          {/* Wybór filamentu */}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Filament</label>
            {filaments.length === 0 ? (
              <p className="text-xs text-danger-600 bg-danger-50 border border-danger-100 rounded-xl p-3">
                Brak filamentów na liście. Poproś administratora o dodanie ich w panelu admina.
              </p>
            ) : (
              <select
                name="filament_id"
                value={filamentId}
                onChange={(e) => setFilamentId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition cursor-pointer"
              >
                {filaments.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.cost_per_gram.toFixed(2)} zł/g)
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Waga (gramy)</label>
              <input 
                name="weight"
                type="number" 
                min="0" 
                step="any"
                value={weight} 
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} 
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition" 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">
                Czas wydruku (w godzinach)
              </label>
              <input 
                name="hours" 
                type="number"
                step="0.1"
                min="0"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Ilość / Koszt / Termin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ilość sztuk
            </label>
            <input 
              name="quantity" 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
              required 
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Proponowany Koszt (zł)
            </label>
            <input 
              name="estimated_cost" 
              type="number" 
              step="0.01" 
              value={cost} 
              onChange={(e) => setCost(e.target.value)} 
              required 
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 p-3.5 text-sm font-bold text-brand-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Termin realizacji
            </label>
            <input 
              name="due_date" 
              type="date" 
              required 
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition" 
            />
          </div>
        </div>

        {/* Pliki */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Plik modelu (STL, 3MF)
            </label>
            <input 
              name="model_file" 
              type="file" 
              accept=".stl,.3mf" 
              required 
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer file:transition" 
            />
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Zdjęcie podglądu
            </label>
            <input 
              name="image_file" 
              type="file" 
              accept="image/*" 
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer file:transition" 
            />
          </div>
        </div>

        {/* Uwagi */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Uwagi do wydruku (opcjonalnie)
          </label>
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="np. wypełnienie 20%, podpory tylko od strony płyty"
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>

        {/* Drukarka (opcjonalnie) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Drukarka
          </label>
          <select
            name="printer_id"
            defaultValue=""
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition cursor-pointer"
          >
            <option value="">— Nieprzypisana (wybierze operator) —</option>
            {printers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Priorytet */}
        <label className="flex items-center gap-3 p-4 rounded-xl border border-warning-200 bg-warning-50/60 cursor-pointer select-none">
          <input
            name="is_priority"
            type="checkbox"
            className="w-4 h-4 accent-warning-500 cursor-pointer"
          />
          <Star className="w-4 h-4 text-warning-500 fill-warning-400" />
          <span className="text-sm font-semibold text-warning-800">
            Pilne – wrzuć na górę kolejki
          </span>
        </label>

        {/* Przycisk wysłania */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={filaments.length === 0}
            className="disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto px-6 py-3.5 cursor-pointer rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/10 transition block text-center"
          >
            Dodaj do kolejki
          </button>
        </div>
      </form>
    </div>
  )
}