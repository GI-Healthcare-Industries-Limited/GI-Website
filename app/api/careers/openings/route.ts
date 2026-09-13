import { getCareerOpenings } from '@/lib/career-openings'

export async function GET() {
  try {
    return Response.json(await getCareerOpenings(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Career availability check failed', error)
    return Response.json({ error: 'We could not check application availability. Please try again shortly.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
    })
  }
}
