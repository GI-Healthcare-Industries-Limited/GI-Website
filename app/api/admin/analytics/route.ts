import { requireWebsiteAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { analyticsReportQuerySchema } from '@/lib/website-analytics'

export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store'}
export async function GET(request:Request){
  try{
    if(!await requireWebsiteAdmin(request))return Response.json({error:'Unauthorized'},{status:401,headers})
    const search=new URL(request.url).searchParams
    const parsed=analyticsReportQuerySchema.safeParse(Object.fromEntries(search))
    if(!parsed.success || [...search.keys()].some(key=>search.getAll(key).length!==1))return Response.json({error:'Choose a valid page, period and page of results.'},{status:400,headers})
    const {days,page,offset,before}=parsed.data
    const snapshot=before?Date.parse(before):Date.now()
    if(snapshot>Date.now()+1000 || snapshot<Date.now()-30*86400000)return Response.json({error:'This report has expired. Refresh analytics.'},{status:400,headers})
    const {data,error}=await getSupabaseAdmin().rpc('website_analytics_explorer',{
      days:Number(days),selected_page:page==='all'?null:page,row_offset:offset,snapshot_at:new Date(snapshot).toISOString(),
    }).abortSignal(AbortSignal.timeout(10000))
    if(error)throw new Error('Unavailable')
    return Response.json({...data,checkedAt:new Date().toISOString()},{headers})
  }catch{
    console.error(JSON.stringify({level:'error',route:'/api/admin/analytics',message:'Analytics report unavailable'}))
    return Response.json({error:'Analytics are temporarily unavailable. Please try again.'},{status:503,headers})
  }
}
