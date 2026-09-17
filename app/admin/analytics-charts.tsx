'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { countryName, type AnalyticsGroup } from '@/lib/analytics-report'
import styles from './website-analytics.module.css'

function Chart({ option, label }: { option: EChartsCoreOption; label: string }) {
  const element = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false, chart: EChartsType | undefined, observer: ResizeObserver | undefined
    setFailed(false)
    import('@/lib/analytics-chart-engine').then(({ echarts }) => {
      if (cancelled || !element.current) return
      chart = echarts.init(element.current, undefined, { renderer: 'canvas' })
      chart.setOption(option)
      observer = new ResizeObserver(() => chart?.resize()); observer.observe(element.current)
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; observer?.disconnect(); chart?.dispose() }
  }, [option])
  return <div className={styles.chartWrap}><div className={styles.chartCanvas} ref={element} role="img" aria-label={label}/>{failed && <p className={styles.chartFallback}>Chart unavailable. The figures are available below.</p>}</div>
}

export function ActivityChart({ points }: { points: { day: string; views: number }[] }) {
  const option = useMemo<EChartsCoreOption>(() => ({
    animation: false, textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 12 },
    grid: { left: 38, right: 16, top: 25, bottom: 32 },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
    xAxis: { type: 'category', boundaryGap: false, data: points.map(p => new Date(p.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })), axisLine: { lineStyle: { color: '#dfe4df' } }, axisTick: { show: false }, axisLabel: { color: '#667169', hideOverlap: true } },
    yAxis: { type: 'value', minInterval: 1, splitNumber: 4, axisLabel: { color: '#667169' }, splitLine: { lineStyle: { color: '#edf0ec' } } },
    series: [{ name: 'Page views', type: 'line', data: points.map(p => p.views), symbol: 'circle', symbolSize: 7, lineStyle: { color: '#23674e', width: 2 }, itemStyle: { color: '#23674e' }, areaStyle: { color: '#e3ece6', opacity: .8 }, label: { show: points.length <= 7, position: 'top', color: '#26322b', fontSize: 12 } }],
  }), [points])
  return <Chart option={option} label="Daily page views. Exact values are in View daily figures below."/>
}

export function LocationMap({ countries }: { countries: AnalyticsGroup[] }) {
  const [option, setOption] = useState<EChartsCoreOption | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController(); setFailed(false)
    Promise.all([import('@/lib/analytics-chart-engine'), import('d3-geo'), fetch('/analytics/world.json', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Map unavailable'); return r.json() })]).then(([{ echarts }, { geoNaturalEarth1 }, asset]) => {
      if (controller.signal.aborted) return
      if (!echarts.getMap('gi-world')) echarts.registerMap('gi-world', asset.world)
      const data = countries.filter(row => asset.centres[row.label]).map(row => ({ name: countryName(row.label), value: [...asset.centres[row.label], row.views] }))
      const max = Math.max(1, ...countries.map(row => row.views))
      const projection = geoNaturalEarth1()
      setOption({
        animation: false, tooltip: { trigger: 'item', renderMode: 'richText', confine: true, formatter: (p: unknown) => {
          const item = p as { name: string; value?: number[] }
          return `${item.name}\n${item.value?.[2] || 0} page views`
        } },
        geo: { map: 'gi-world', roam: false, silent: true, left: 0, right: 0, top: 8, bottom: 8,
          projection: { project: (point: [number, number]) => projection(point), unproject: (point: [number, number]) => projection.invert!(point), stream: projection.stream },
          itemStyle: { areaColor: '#e2e7e1', borderColor: '#fff', borderWidth: .5 }, emphasis: { disabled: true } },
        series: [
          { type: 'scatter', coordinateSystem: 'geo', data, symbolSize: (value: number[]) => 12 + Math.sqrt(value[2] / max) * 27, itemStyle: { color: '#72977c', opacity: .3 }, silent: true },
          { name: 'Country page views', type: 'scatter', coordinateSystem: 'geo', data, symbolSize: (value: number[]) => 5 + Math.sqrt(value[2] / max) * 14, itemStyle: { color: '#3e7353', opacity: .85, borderColor: '#fff', borderWidth: 1 } },
        ],
      })
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [countries])
  if (failed) return <p className={styles.chartFallback}>Map unavailable. Location figures are still listed.</p>
  if (!option) return <div className={styles.chartWrap} role="status">Loading map…</div>
  return <Chart option={option} label="World map showing page-view counts grouped by country. Circles do not show visitors’ exact locations. Country and city figures are listed alongside."/>
}
