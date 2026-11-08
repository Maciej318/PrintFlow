'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

export const THEMES = [
  { id: 'default', label: 'Domyślny' },
  { id: 'rg', label: 'Daltonizm: czerwony/zielony' },
  { id: 'tritan', label: 'Daltonizm: niebieski/żółty' },
  { id: 'contrast', label: 'Wysoki kontrast' },
] as const

const STORAGE_KEY = 'pf-theme'

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>('default')

  
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'default')
  }, [])

  const handleChange = (value: string) => {
    setTheme(value)
    document.documentElement.dataset.theme = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      
    }
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted">
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Tryb kolorów</span>
      <select
        value={theme}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Tryb kolorów (dla osób z daltonizmem)"
        className="cursor-pointer bg-transparent text-xs font-semibold text-foreground outline-none"
      >
        {THEMES.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </label>
  )
}
