"use server"
import { cookies } from "next/headers";
import { createClient } from "./utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"
import type {
  ActionResult,
  AppSettings,
  CompletedOrderStat,
  Filament,
  Printer,
  Worker,
} from "./types"

const BUCKET = 'order-files'
const MAX_MODEL_SIZE = 90 * 1024 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024  
const ALLOWED_MODEL_EXT = ['stl', '3mf']

// ---------------------------------------------------------------------------
// Pomocnicze funkcje autoryzacji
// ---------------------------------------------------------------------------

type Supabase = ReturnType<typeof createClient>

type AuthOk = { ok: true; supabase: Supabase; userId: string }
type AuthFail = { ok: false; error: string }

async function authenticate(): Promise<{ supabase: Supabase; userId: string | null; role: string | null; approved: boolean }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, userId: null, role: null, approved: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? null
  return { supabase, userId: user.id, role, approved: role === 'admin' || profile?.is_approved === true }
}


async function requireAdmin(): Promise<AuthOk | AuthFail> {
  const { supabase, userId, role } = await authenticate()
  if (!userId) return { ok: false, error: 'Brak autoryzacji' }
  if (role !== 'admin') return { ok: false, error: 'Tylko administrator może wykonać tę akcję' }
  return { ok: true, supabase, userId }
}


async function requireApproved(): Promise<AuthOk | AuthFail> {
  const { supabase, userId, approved } = await authenticate()
  if (!userId) return { ok: false, error: 'Brak autoryzacji' }
  if (!approved) return { ok: false, error: 'Twoje konto nie zostało jeszcze zatwierdzone przez administratora' }
  return { ok: true, supabase, userId }
}

// ---------------------------------------------------------------------------
// Logowanie / rejestracja
// ---------------------------------------------------------------------------

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/?message=Sprawdz+skrzynke+email+aby+potwierdzic+konto')
}

// ---------------------------------------------------------------------------
// Zlecenia
// ---------------------------------------------------------------------------

function failOrder(message: string): never {
  redirect(`/dashboard?error=${encodeURIComponent(message)}`)
}

export async function createOrder(formData: FormData) {
  const auth = await requireApproved()
  if (!auth.ok) failOrder(auth.error)
  const { supabase, userId } = auth

  const modelName = ((formData.get('model_name') as string) || '').trim()
  const quantity = parseInt(formData.get('quantity') as string)
  const estimatedCost = parseFloat(formData.get('estimated_cost') as string)
  const hours = parseFloat(formData.get('hours') as string)
  const weight = parseFloat(formData.get('weight') as string)
  const dueDate = (formData.get('due_date') as string) || ''
  const notes = ((formData.get('notes') as string) || '').trim()
  const file = formData.get('model_file') as File | null
  const image = formData.get('image_file') as File | null
  const filamentId = (formData.get('filament_id') as string) || null
  const printerId = (formData.get('printer_id') as string) || null
  const isPriority = formData.get('is_priority') === 'on'

  if (!modelName || modelName.length > 200) failOrder('Podaj nazwę wydruku (maks. 200 znaków).')
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) failOrder('Ilość sztuk musi być liczbą od 1 do 10000.')
  if (!Number.isFinite(estimatedCost) || estimatedCost < 0) failOrder('Koszt musi być liczbą nieujemną.')
  if (!Number.isFinite(hours) || hours < 0) failOrder('Czas wydruku musi być liczbą nieujemną.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) failOrder('Podaj poprawny termin realizacji.')
  if (!file || file.size === 0) failOrder('Dodaj plik modelu (STL lub 3MF).')
  if (!ALLOWED_MODEL_EXT.includes(file.name.split('.').pop()?.toLowerCase() ?? '')) failOrder('Dozwolone formaty modelu: STL, 3MF.')
  if (file.size > MAX_MODEL_SIZE) failOrder('Plik modelu jest za duży (maks. 90 MB).')
  if (image && image.size > 0) {
    if (!image.type.startsWith('image/')) failOrder('Zdjęcie podglądu musi być obrazem.')
    if (image.size > MAX_IMAGE_SIZE) failOrder('Zdjęcie podglądu jest za duże (maks. 5 MB).')
  }


  let filamentName: string | null = null
  if (filamentId) {
    const { data } = await supabase.from('filaments').select('name').eq('id', filamentId).single()
    if (!data) failOrder('Wybrany filament nie istnieje.')
    filamentName = data.name
  }

  let printerName: string | null = null
  if (printerId) {
    const { data } = await supabase.from('printers').select('name').eq('id', printerId).single()
    if (!data) failOrder('Wybrana drukarka nie istnieje.')
    printerName = data.name
  }

  
  const uploaded: string[] = []
  const cleanup = async () => {
    if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded)
  }

  const modelExt = file.name.split('.').pop()!.toLowerCase()
  const modelUpload = await supabase.storage.from(BUCKET).upload(`models/${crypto.randomUUID()}.${modelExt}`, file)
  if (modelUpload.error) {
    console.error('Błąd wysyłki modelu:', modelUpload.error)
    failOrder('Nie udało się wysłać pliku modelu: ' + modelUpload.error.message)
  }
  uploaded.push(modelUpload.data.path)

  let imagePath: string | null = null
  if (image && image.size > 0) {
    const imageExt = (image.name.split('.').pop() || 'png').toLowerCase()
    const imageUpload = await supabase.storage.from(BUCKET).upload(`images/${crypto.randomUUID()}.${imageExt}`, image)
    if (imageUpload.error) {
      console.error('Błąd wysyłki zdjęcia:', imageUpload.error)
      await cleanup()
      failOrder('Nie udało się wysłać zdjęcia: ' + imageUpload.error.message)
    }
    const uploadedImagePath: string = imageUpload.data.path
    imagePath = uploadedImagePath
    uploaded.push(uploadedImagePath)
  }

  const { error: insertError } = await supabase.from('orders').insert({
    user_id: userId,
    model_name: modelName,
    file_path: modelUpload.data.path,
    image_path: imagePath,
    quantity,
    estimated_cost: estimatedCost,
    hours,
    weight_g: Number.isFinite(weight) ? weight : null,
    due_date: dueDate,
    notes: notes || null,
    filament_id: filamentId,
    filament_name: filamentName,
    printer_id: printerId,
    printer_name: printerName,
    is_priority: isPriority
  })

  if (insertError) {
    console.error('Błąd zapisu zlecenia:', insertError)
    await cleanup()
    failOrder('Nie udało się zapisać zlecenia: ' + insertError.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  const auth = await requireApproved()
  if (!auth.ok) return { success: false, error: auth.error }

  if (!['pending', 'printing', 'completed', 'failed'].includes(status)) {
    return { success: false, error: 'Nieprawidłowy status.' }
  }

  const { data, error } = await auth.supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()

  if (error) {
    console.error('Błąd podczas aktualizacji statusu:', error)
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: "Brak uprawnień do edycji tego rekordu (RLS) lub rekord nie istnieje."
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleOrderPriority(orderId: string, isPriority: boolean): Promise<ActionResult> {
  const auth = await requireApproved()
  if (!auth.ok) return { success: false, error: auth.error }

  const { data, error } = await auth.supabase
    .from('orders')
    .update({ is_priority: isPriority })
    .eq('id', orderId)
    .select()

  if (error) {
    console.error('Błąd zmiany priorytetu:', error)
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'Brak uprawnień do edycji tego rekordu (RLS) lub rekord nie istnieje.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}


export async function assignOrderPrinter(orderId: string, printerId: string | null): Promise<ActionResult> {
  const auth = await requireApproved()
  if (!auth.ok) return { success: false, error: auth.error }

  let printerName: string | null = null
  if (printerId) {
    const { data: printer } = await auth.supabase.from('printers').select('name').eq('id', printerId).single()
    if (!printer) return { success: false, error: 'Wybrana drukarka nie istnieje.' }
    printerName = printer.name
  }

  const { data, error } = await auth.supabase
    .from('orders')
    .update({ printer_id: printerId, printer_name: printerName })
    .eq('id', orderId)
    .select()

  if (error) {
    console.error('Błąd przypisania drukarki:', error)
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'Brak uprawnień do edycji tego rekordu (RLS) lub rekord nie istnieje.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {

  const auth = await requireApproved()
  if (!auth.ok) return { success: false, error: auth.error }
  const { supabase } = auth

  const { data: order } = await supabase
    .from('orders')
    .select('file_path, image_path')
    .eq('id', orderId)
    .single()

  
  const { data: deleted, error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .select('id')

  if (error) {
    console.error('Błąd podczas usuwania zlecenia:', error)
    return { success: false, error: error.message }
  }

  if (!deleted || deleted.length === 0) {
    console.error('Usuwanie zlecenia nie usunęło żadnego wiersza (prawdopodobnie brak polityki DELETE w RLS):', orderId)
    return {
      success: false,
      error: 'Baza danych nie pozwoliła usunąć zlecenia (brak polityki DELETE w tabeli orders). Uruchom plik supabase-permissions.sql w Supabase SQL Editor.',
    }
  }

  const paths = [order?.file_path, order?.image_path].filter((p): p is string => !!p)
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths)
    if (storageError) console.error('Nie udało się usunąć plików zlecenia:', storageError)
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getCompletedOrdersStats(): Promise<CompletedOrderStat[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('orders')
    .select('id, due_date, estimated_cost, quantity, hours')
    .eq('status', 'completed')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Błąd pobierania statystyk:', error)
    return []
  }

  return (data as CompletedOrderStat[]) || []
}

// ---------------------------------------------------------------------------
// Pracownicy (tylko admin)
// ---------------------------------------------------------------------------

export async function getWorkers(): Promise<Worker[]> {
  const auth = await requireAdmin()
  if (!auth.ok) return []

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('id, email, role, is_approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Błąd pobierania pracowników:', error.message)
    return []
  }

  return (data || []).map(w => ({ ...w, is_approved: !!w.is_approved }))
}

export async function toggleWorkerApproval(workerId: string, isApproved: boolean): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (workerId === auth.userId) return { success: false, error: 'Nie możesz zmienić dostępu własnego konta.' }

  const { error } = await auth.supabase
    .from('profiles')
    .update({ is_approved: isApproved })
    .eq('id', workerId)

  if (error) {
    console.error('Błąd zmiany zatwierdzenia pracownika:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteWorker(workerId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (workerId === auth.userId) return { success: false, error: 'Nie możesz usunąć własnego konta.' }

  const { error } = await auth.supabase
    .from('profiles')
    .delete()
    .eq('id', workerId)

  if (error) {
    console.error('Błąd usuwania pracownika:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Ustawienia / filamenty / drukarki
// ---------------------------------------------------------------------------

export async function getAppSettings(): Promise<AppSettings> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('settings')
    .select('cost_per_hour')
    .eq('id', 1)
    .single()

  if (error || !data) {
    console.error('Błąd pobierania ustawień:', error)
    return { cost_per_hour: 2.50 }
  }
  return { cost_per_hour: Number(data.cost_per_hour) }
}


export async function updateHourlyRate(costPerHour: number): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (!Number.isFinite(costPerHour) || costPerHour < 0) return { success: false, error: 'Nieprawidłowa stawka.' }


  const { error } = await auth.supabase
    .from('settings')
    .upsert({ id: 1, cost_per_hour: costPerHour })

  if (error) {
    console.error('Błąd zapisu ustawień:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getFilaments(): Promise<Filament[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('filaments')
    .select('id, name, cost_per_gram')
    .order('name', { ascending: true })

  if (error) {
    console.error('Błąd pobierania filamentów:', error)
    return []
  }
  return (data || []).map(f => ({ ...f, cost_per_gram: Number(f.cost_per_gram) }))
}

export async function addFilament(name: string, costPerGram: number): Promise<ActionResult & { filament?: Filament }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (!name.trim() || !Number.isFinite(costPerGram) || costPerGram < 0) return { success: false, error: 'Nieprawidłowe dane filamentu.' }

  const { data, error } = await auth.supabase
    .from('filaments')
    .insert({ name: name.trim(), cost_per_gram: costPerGram })
    .select('id, name, cost_per_gram')
    .single()

  if (error) {
    console.error('Błąd dodawania filamentu:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, filament: { ...data, cost_per_gram: Number(data.cost_per_gram) } }
}

export async function updateFilament(id: string, name: string, costPerGram: number): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (!name.trim() || !Number.isFinite(costPerGram) || costPerGram < 0) return { success: false, error: 'Nieprawidłowe dane filamentu.' }

  const { error } = await auth.supabase
    .from('filaments')
    .update({ name: name.trim(), cost_per_gram: costPerGram })
    .eq('id', id)

  if (error) {
    console.error('Błąd edycji filamentu:', error)
    return { success: false, error: error.message }
  }

  await auth.supabase.from('orders').update({ filament_name: name.trim() }).eq('filament_id', id)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteFilament(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const { error } = await auth.supabase
    .from('filaments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Błąd usuwania filamentu:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getPrinters(): Promise<Printer[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('printers')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Błąd pobierania drukarek:', error)
    return []
  }
  return data || []
}

export async function addPrinter(name: string): Promise<ActionResult & { printer?: Printer }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (!name.trim()) return { success: false, error: 'Podaj nazwę drukarki.' }

  const { data, error } = await auth.supabase
    .from('printers')
    .insert({ name: name.trim() })
    .select('id, name')
    .single()

  if (error) {
    console.error('Błąd dodawania drukarki:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, printer: data }
}

export async function renamePrinter(id: string, name: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  if (!name.trim()) return { success: false, error: 'Podaj nazwę drukarki.' }

  const { error } = await auth.supabase
    .from('printers')
    .update({ name: name.trim() })
    .eq('id', id)

  if (error) {
    console.error('Błąd zmiany nazwy drukarki:', error)
    return { success: false, error: error.message }
  }

  await auth.supabase.from('orders').update({ printer_name: name.trim() }).eq('printer_id', id)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deletePrinter(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const { error } = await auth.supabase
    .from('printers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Błąd usuwania drukarki:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}