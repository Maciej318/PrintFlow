'use client'

import { ClipboardList, CirclePlus, History, LogOut, Settings, BarChart3 } from "lucide-react"
import type { Tab } from "@/types"

interface SidebarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  isAdmin: boolean
  onLogout: () => void
}

export default function Sidebar({ activeTab, setActiveTab, isAdmin, onLogout }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-sm">
      <div className="space-y-2">
        
        
        <button 
          onClick={() => setActiveTab('kolejka')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'kolejka' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <ClipboardList className="w-5 h-5" />
          Zakolejkowane wydruki
        </button>

        
        <button 
          onClick={() => setActiveTab('dodaj')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'dodaj' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <CirclePlus className="w-5 h-5" />
          Dodaj zlecenie
        </button>

       
        <button 
          onClick={() => setActiveTab('historia')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'historia' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <History className="w-5 h-5" />  
          Historia zleceń
        </button>

        
        <button 
          onClick={() => setActiveTab('statystyki')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'statystyki' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <BarChart3 className="w-5 h-5" />  
          Statystyki
        </button>

        
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'admin' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Settings className="w-5 h-5" />  
            Ustawienia / Admin
          </button>
        )}
      </div>

      
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm text-danger-600 hover:bg-danger-50 border border-transparent hover:border-danger-100 transition cursor-pointer"
      >
        <LogOut className="w-5 h-5" />  
        Wyloguj się
      </button>
    </aside>
  )
}