import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store'}
export async function GET(request:Request){
  try{
    if(!await requireWebsiteAdmin(request))return Response.json({error:'Unauthorized'},{status:401,headers})
    const days=Number(new URL(request.url).searchParams.get('days')||7)
    if(![7,14,30].includes(days))return Response.json({error:'Choose 7, 14 or 30 days.'},{status:400,headers})
    const {data,error}=await getSupabaseAdmin().rpc('website_analytics_report',{days}).abortSignal(AbortSignal.timeout(10000))
    if(error)throw new Error('Unavailable')
    return Response.json({...data,checkedAt:new Date().toISOString()},{headers})
  }catch{
    console.error(JSON.stringify({level:'error',route:'/api/admin/analytics',message:'Analytics report unavailable'}))
    return Response.json({error:'Analytics are temporarily unavailable. Please try again.'},{status:503,headers})
  }
}
