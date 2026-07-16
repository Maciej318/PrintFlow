'use client'

import { useState } from 'react'
import { createOrder } from '@/actions'

// Definiujemy interfejs dla przekazywanych stawek
interface OrderFormProps {
  costPerGram: number
  costPerHour: number
}

export default function OrderForm({ costPerGram, costPerHour }: OrderFormProps) {
  const [quantity, setQuantity] = useState<number>(1)
  const [weight, setWeight] = useState<number>(0)
  const [hours, setHours] = useState<number>(0)
  const [cost, setCost] = useState<string>('0.00')

  // Funkcja obliczająca cenę na podstawie przekazanych z góry stawek
  const handleKalkulacja = (w: number, h: number, q: number) => {
    const total = ((w * costPerGram) + (h * costPerHour)) * q
    setCost(total.toFixed(2))
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
        Dodaj nowe zlecenie druku
      </h2>
      
      <form action={createOrder} className="space-y-6">
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Nazwa wydruku
          </label>
          <input 
            name="model_name" 
            type="text" 
            required 
            placeholder="np. Projekt_budynku.stl" 
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" 
          />
        </div>

        
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Kalkulator danych ze Slicera
            </span>
            {/* Opcjonalna informacja dla użytkownika o aktualnych stawkach */}
            <span className="text-[10px] text-slate-400 font-medium">
              Stawki: {costPerGram.toFixed(2)}zł/g | {costPerHour.toFixed(2)}zł/h
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Waga (gramy)</label>
              <input 
                type="number" 
                min="0" 
                step="any"
                value={weight} 
                onChange={(e) => { const v = parseFloat(e.target.value) || 0; setWeight(v); handleKalkulacja(v, hours, quantity) }} 
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Czas (godziny)</label>
              <input 
                type="number" 
                min="0" 
                step="any"
                value={hours} 
                onChange={(e) => { const v = parseFloat(e.target.value) || 0; setHours(v); handleKalkulacja(weight, v, quantity) }} 
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" 
              />
            </div>
          </div>
        </div>

        
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
              onChange={(e) => { const v = parseInt(e.target.value) || 1; setQuantity(v); handleKalkulacja(weight, hours, v) }} 
              required 
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Koszt (zł)
            </label>
            <input 
              name="estimated_cost" 
              type="number" 
              step="0.01" 
              value={cost} 
              onChange={(e) => setCost(e.target.value)} 
              required 
              className="w-full rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 text-sm font-bold text-blue-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" 
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
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" 
            />
          </div>
        </div>

        
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
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer file:transition" 
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

        
        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit" 
            className="w-full sm:w-auto px-6 py-3.5 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition block text-center"
          >
            Dodaj do kolejki
          </button>
        </div>
      </form>
    </div>
  )
}