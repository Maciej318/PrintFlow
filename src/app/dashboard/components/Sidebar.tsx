'use client'

import { ClipboardList, CirclePlus, History, LogOut, Settings, BarChart3 } from "lucide-react" // <-- Dodana ikona BarChart3

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: any) => void
  isAdmin: boolean
  onLogout: () => void
}

export default function Sidebar({ activeTab, setActiveTab, isAdmin, onLogout }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-sm">
      <div className="space-y-2">
        
        {/* Zakolejkowane wydruki */}
        <button 
          onClick={() => setActiveTab('kolejka')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'kolejka' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <ClipboardList className="w-5 h-5" />
          Zakolejkowane wydruki
        </button>

        {/* Dodaj zlecenie */}
        <button 
          onClick={() => setActiveTab('dodaj')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'dodaj' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <CirclePlus className="w-5 h-5" />
          Dodaj zlecenie
        </button>

        {/* Historia zleceń */}
        <button 
          onClick={() => setActiveTab('historia')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'historia' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <History className="w-5 h-5" />  
          Historia zleceń
        </button>

        {/* NOWY PRZYCISK: Statystyki */}
        <button 
          onClick={() => setActiveTab('statystyki')} 
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'statystyki' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <BarChart3 className="w-5 h-5" />  
          Statystyki
        </button>

        {/* Panel Admina (tylko dla admina) */}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition cursor-pointer ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Settings className="w-5 h-5" />  
            Ustawienia / Admin
          </button>
        )}
      </div>

      {/* Przycisk Wyloguj */}
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition cursor-pointer"
      >
        <LogOut className="w-5 h-5" />  
        Wyloguj się
      </button>
    </aside>
  )
}