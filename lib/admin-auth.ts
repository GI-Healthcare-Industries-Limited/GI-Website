import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type WebsiteAdmin = {
  userId: string
  email: string
  displayName: string | null
}

export async function requireWebsiteAdmin(request: Request): Promise<WebsiteAdmin | null> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return null

  const supabase = getSupabaseAdmin()
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user?.email) return null

  const { data: admin, error: adminError } = await supabase
    .from('website_admins')
    .select('user_id, email, display_name')
    .eq('user_id', userData.user.id)
    .eq('active', true)
    .maybeSingle()

  if (adminError || !admin) return null

  return {
    userId: admin.user_id as string,
    email: admin.email as string,
    displayName: (admin.display_name as string | null) ?? null,
  }
}
