'use client'

export default function Navbar({ userEmail, role }: { userEmail: string; role?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">PrintFlow</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{userEmail.split('@')[0]}</p>
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
            {role === 'admin' ? 'Administrator' : 'Pracownik'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
          {userEmail[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  )
}