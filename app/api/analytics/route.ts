import { createHmac } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { analyticsConsent, analyticsEventSchema, coarseClient } from '@/lib/website-analytics'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }
export async function POST(request: Request) {
  // Only same-origin, explicitly opted-in requests. Nothing from form fields or arbitrary URLs.
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null,{status:403,headers})
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null,{status:415,headers})
  try {
    const reader = request.body?.getReader()
    if (!reader) return new Response(null,{status:400,headers})
    let length=0;const chunks:Uint8Array[]=[]
    while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>1024){await reader.cancel();return new Response(null,{status:413,headers})}chunks.push(value)}
    let body: unknown
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) }
    catch { return new Response(null,{status:400,headers}) }
    const parsed = analyticsEventSchema.safeParse(body)
    if (!parsed.success || !analyticsConsent(request.headers.get('cookie'),parsed.data.consentAt)) return new Response(null,{status:400,headers})
    const ua=request.headers.get('user-agent')||''
    if (/bot|crawler|spider|headless/i.test(ua)) return new Response(null,{status:204,headers})
    const secret=process.env.SUBMISSION_HASH_SECRET
    if(!secret)throw new Error('Unavailable')
    // IP is used transiently for abuse prevention only, never stored with analytics.
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'
    const fingerprint=createHmac('sha256',secret).update(`analytics:${Math.floor(Date.now()/3600000)}:${ip}`).digest('hex')
    const location=process.env.VERCEL==='1'?request.headers.get('x-vercel-ip-country')||'ZZ':'ZZ'
    const country=/^[A-Z]{2}$/.test(location)?location:'ZZ'
    const {error,data}=await getSupabaseAdmin().rpc('record_website_view',{
      event: {...parsed.data,...coarseClient(ua),country}, bucket:fingerprint,
    }).abortSignal(AbortSignal.timeout(8000))
    if(error)throw new Error('Unavailable')
    return new Response(null,{status:data?204:429,headers})
  } catch {
    console.error(JSON.stringify({level:'error',route:'/api/analytics',message:'Analytics unavailable'}))
    return new Response(null,{status:503,headers})
  }
}
