// Retired after verifying there are no legacy files or CV applications. Do not
// issue signed links that bypass the submission retention boundary.
export async function GET() {
  return Response.json({ error: 'CV uploads and downloads are no longer available.' }, {
    status: 410, headers: { 'Cache-Control': 'private, no-store' },
  })
}
