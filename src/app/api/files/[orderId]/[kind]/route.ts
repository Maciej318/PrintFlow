import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const BUCKET = 'order-files'
const SIGNED_URL_TTL = 60 * 10 // 10 minut – link jest generowany od nowa przy każdym otwarciu

/**
 * Stały adres do plików zlecenia: /api/files/<id zlecenia>/file  (model STL/3MF)
 *                                  /api/files/<id zlecenia>/image (zdjęcie podglądu)
 * Sprawdza logowanie, generuje świeży podpisany link do prywatnego bucketa i przekierowuje.
 * Dzięki temu linki na stronie nigdy nie wygasają.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; kind: string }> }
) {
  const { orderId, kind } = await params
  if (kind !== 'file' && kind !== 'image') {
    return new NextResponse('Nie znaleziono', { status: 404 })
  }

  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Brak autoryzacji', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin' && profile?.is_approved !== true) {
    return new NextResponse('Konto niezatwierdzone', { status: 403 })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('model_name, file_path, image_path')
    .eq('id', orderId)
    .single()

  const path = kind === 'file' ? order?.file_path : order?.image_path
  if (!order || !path) return new NextResponse('Nie znaleziono', { status: 404 })

  // dla modelu wymuszamy pobranie pod czytelną nazwą (nazwa zlecenia + rozszerzenie)
  let options: { download: string } | undefined
  if (kind === 'file') {
    const ext = path.split('.').pop()
    const hasExt = ext && order.model_name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
    options = { download: ext && !hasExt ? `${order.model_name}.${ext}` : order.model_name }
  }

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL, options)

  if (error || !signed?.signedUrl) {
    console.error('Błąd generowania linku do pliku:', error)
    return new NextResponse('Plik niedostępny', { status: 404 })
  }

  const response = NextResponse.redirect(signed.signedUrl, 302)
  // przekierowanie można krótko trzymać w cache (krócej niż ważność linku), plik – nie
  response.headers.set('Cache-Control', kind === 'image' ? 'private, max-age=300' : 'private, no-store')
  return response
}
