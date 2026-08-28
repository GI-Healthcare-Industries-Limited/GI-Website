import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const admin = await requireWebsiteAdmin(request)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const cvPath = new URL(request.url).searchParams.get('path')
  if (!cvPath || cvPath.length > 500 || cvPath.includes('..')) {
    return Response.json({ error: 'Invalid CV path.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: application, error: applicationError } = await supabase
    .from('career_applications')
    .select('id')
    .eq('cv_path', cvPath)
    .maybeSingle()

  if (applicationError || !application) {
    return Response.json({ error: 'CV not found.' }, { status: 404 })
  }

  const { data, error } = await supabase.storage.from('career-cvs').createSignedUrl(cvPath, 60)
  if (error || !data?.signedUrl) {
    console.error('Signed CV URL creation failed', error)
    return Response.json({ error: 'Could not open the CV.' }, { status: 500 })
  }

  return Response.json({ url: data.signedUrl })
}
