'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Clock, LogOut } from 'lucide-react'
import ThemeSwitcher from './ThemeSwitcher'

export default function PendingApproval({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-700">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Konto czeka na zatwierdzenie</h1>
        <p className="mt-2 text-sm text-muted">
          Zalogowano jako <span className="font-semibold text-foreground">{userEmail}</span>.
          Administrator musi najpierw aktywować Twoje konto, zanim zobaczysz zlecenia.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Wyloguj się
        </button>
      </div>
    </div>
  )
}
