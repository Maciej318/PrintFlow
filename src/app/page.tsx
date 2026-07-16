import { login, signup } from '@/actions'
import { CircleX, Bell } from 'lucide-react';

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams.error
  const message = searchParams.message

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Nagłówek */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            System Druku 3D
          </h1>
          <p className="mt-1 text-sm text-muted">
            Panel logowania dla pracowników
          </p>
        </div>

        {/* Formularz */}
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
              Adres Email
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="pracownik@firma.pl"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none transition"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
              Hasło
            </label>

            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <CircleX className='w-5 h-5'/>
              {error}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <Bell className='w-5 h-5'/>
              {message}
            </div>
          )}

          {/* Przyciski */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              formAction={login}
              className="w-full cursor-pointer rounded-lg bg-blue-600 p-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
            >
              Zaloguj się
            </button>

            <button
              type="submit"
              formAction={signup}
              className="w-full cursor-pointer rounded-lg border border-border bg-card p-3 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              Zarejestruj nowe konto pracownika
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}