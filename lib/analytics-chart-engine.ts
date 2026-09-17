import * as echarts from 'echarts/core'
import { LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, GeoComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, ScatterChart, GridComponent, TooltipComponent, GeoComponent, AriaComponent, CanvasRenderer])
export { echarts }
