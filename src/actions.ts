"use server"
import { cookies } from "next/headers";
import { createClient } from "./utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"



export async function login(formData:FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const {error} = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        redirect(`/?error=${encodeURIComponent(error.message)}`)
    }
    redirect('/dashboard')
}

export async function signup(formData:FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const {error} = await supabase.auth.signUp({
        email,
        password
    })

    if (error) {
        redirect(`/?error=${encodeURIComponent(error.message)}`)
    }
    redirect('/?message=Sprawdz+skrzynke+email+aby+potwierdzic+konto')
}

export async function createOrder(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const modelName = formData.get('model_name') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const estimatedCost = parseFloat(formData.get('estimated_cost') as string)
  const dueDate = formData.get('due_date') as string
  const notes = formData.get('notes') as string

  const file = formData.get('model_file') as File
  const image = formData.get('image_file') as File

  let filePath = ''
  let imagePath = ''

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const { data, error } = await supabase.storage.from('order-files').upload(`models/${fileName}`, file)
    if (error) throw new Error(error.message)
    filePath = data.path
  }

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const { data, error } = await supabase.storage.from('order-files').upload(`images/${fileName}`, image)
    if (error) throw new Error(error.message)
    imagePath = data.path
  }

  await supabase.from('orders').insert({
    user_id: user.id,
    model_name: modelName,
    file_path: filePath,
    image_path: imagePath || null,
    quantity,
    estimated_cost: estimatedCost,
    due_date: dueDate,
    notes: notes || null
  })

  redirect('/dashboard')
}


export async function updateOrderStatus(orderId: string, status: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
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

export async function getWorkers() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, is_approved') 
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Błąd pobierania pracowników (pełny):', JSON.stringify(error, null, 2))
    return []
  }

  return data
}

export async function toggleWorkerApproval(workerId: string, isApproved: boolean) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: isApproved })
    .eq('id', workerId)

  if (error) {
    console.error('Błąd zmiany zatwierdzenia pracownika:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteWorker(workerId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', workerId)

  if (error) {
    console.error('Błąd usuwania pracownika:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function getAppSettings() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Błąd pobierania ustawień:', error)
    return { cost_per_gram: 0.15, cost_per_hour: 2.50 }
  }
  return data
}

export async function updateAppSettings(costPerGram: number, costPerHour: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('settings')
    .update({ cost_per_gram: costPerGram, cost_per_hour: costPerHour })
    .eq('id', 1)

  if (error) {
    console.error('Błąd zapisu ustawień:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard') 
  return { success: true }
}
