export const pageLabels = { all: 'All pages', home: 'Home', space: 'Space', careers: 'Careers', contact: 'Contact', apply: 'Application', privacy: 'Privacy' } as const
export type AnalyticsPage = keyof typeof pageLabels
export type AnalyticsGroup = { label: string; views: number }
export type AnalyticsCity = { city: string | null; region: string | null; country: string; views: number }
export type PageView = {
  id: string; created_at: string; page: Exclude<AnalyticsPage, 'all'>; country: string; city: string | null; region: string | null;
  device: string; browser: string; os: string | null; source: string; seconds: number; clicks: number;
}
export type AnalyticsReport = {
  totals: { views: number; average_seconds: number; clicks: number };
  daily: { day: string; views: number }[];
  countries: AnalyticsGroup[]; cities: AnalyticsCity[]; devices: AnalyticsGroup[]; browsers: AnalyticsGroup[]; systems: AnalyticsGroup[]; sources: AnalyticsGroup[];
  records: PageView[]; offset: number; pageSize: number; snapshotAt: string; checkedAt: string;
}
export const formatNumber = new Intl.NumberFormat('en-GB').format
export function duration(value: number) { return value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${value % 60}s` }
export function countryName(code: string) {
  if (code === 'ZZ') return 'Unknown'
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code } catch { return 'Unknown' }
}
export function regionName(country: string, region: string | null) {
  if (!region) return 'Not available'
  if (country === 'GB') return ({ ENG: 'England', SCT: 'Scotland', WLS: 'Wales', NIR: 'Northern Ireland' } as Record<string,string>)[region] || `${country}-${region}`
  return `${country}-${region}`
}
export function dailySeries(data: Pick<AnalyticsReport, 'snapshotAt' | 'daily'>, days: number) {
  const end = new Date(data.snapshotAt)
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(end); date.setUTCDate(date.getUTCDate() - days + 1 + i)
    const day = date.toISOString().slice(0, 10)
    return { day, views: data.daily.find(row => row.day === day)?.views || 0 }
  })
}
