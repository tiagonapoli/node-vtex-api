import { flatten, map, mapObjIndexed, values } from 'ramda'
import { mean, median, percentile } from 'stats-lite'

import { hrToMillis } from '../utils/Time'

export interface Metric {
  name: string
  [key: string]: any
}

interface AggregateMetric extends Metric {
  count: number
  mean: number
  median: number
  percentile95: number
  percentile99: number
  max: number
  production: boolean
}

interface GetStats {
  getStats(): {
    [key: string]: number | boolean | string | undefined,
  }
}

let lastCpu: NodeJS.CpuUsage = process.cpuUsage()

function cpuUsage () {
  const diff = process.cpuUsage(lastCpu)
  lastCpu = {
    system: lastCpu.system + diff.system,
    user: lastCpu.user + diff.user,
  }
  return diff
}

const createMetricToAggregateReducer = (production: boolean) => (value: any, key: string, obj: any): AggregateMetric => {
  const aggregate: AggregateMetric = {
    name: key,
    count: value.length, // tslint:disable-line:object-literal-sort-keys
    max: Math.max(...value),
    mean: mean(value),
    median: median(value),
    percentile95: percentile(value, 0.95),
    percentile99: percentile(value, 0.99),
    production,
  }
  delete obj[key]
  return aggregate
}

export class MetricsAccumulator {
  // Metrics from production workspaces
  private metricsMillis: Record<string, number[]>
  // Metrics from development workspaces
  private devMetricsMillis: Record<string, number[]>
  // Tracked cache instances
  private cacheMap: Record<string, GetStats>

  private onFlushMetrics: Array<() => Metric | Metric[]>

  private metricToAggregate = createMetricToAggregateReducer(true)
  private devMetricToAggregate = createMetricToAggregateReducer(false)

  constructor() {
    this.metricsMillis = {}
    this.devMetricsMillis = {}
    this.onFlushMetrics = []
    this.cacheMap = {}
  }

  public batchHrTimeMetricFromEnd = (name: string, end: [number, number], production: boolean) => {
    this.batchMetric(name, hrToMillis(end), production)
  }

  public batchHrTimeMetric = (name: string, start: [number, number], production: boolean) => {
    this.batchMetric(name, hrToMillis(process.hrtime(start)), production)
  }

  public batchMetric = (name: string, timeMillis: number, production: boolean) => {
    if (production) {
      if (!this.metricsMillis[name]) {
        this.metricsMillis[name] = []
      }
      this.metricsMillis[name].push(timeMillis)
    } else {
      if (!this.devMetricsMillis[name]) {
        this.devMetricsMillis[name] = []
      }
      this.devMetricsMillis[name].push(timeMillis)
    }
  }

  public addOnFlushMetric = (metricFn: () => Metric | Metric[]) => {
    this.onFlushMetrics.push(metricFn)
  }

  public trackCache = (name: string, cacheInstance: GetStats) => {
    this.cacheMap[name] = cacheInstance
  }

  public statusTrack = () => {
    return this.flushMetrics()
  }

  private cacheToMetric = (value: GetStats, key: string): Metric => ({
    name: `${key}-cache`,
    ...value.getStats(),
  })

  private flushMetrics = (): Metric[] => {
    const aggregateMetrics: Metric[] = values(mapObjIndexed(
      this.metricToAggregate,
      this.metricsMillis,
    ))

    const aggregateDevMetrics: Metric[] = values(mapObjIndexed(
      this.devMetricToAggregate,
      this.devMetricsMillis,
    ))

    const systemMetrics: Metric[] = [
      {
        name: 'cpu',
        ...cpuUsage(),
      },
      {
        name: 'memory',
        ...process.memoryUsage(),
      },
    ]

    const onFlushMetrics = flatten(map(getMetric => getMetric(), this.onFlushMetrics)) as Metric[]

    const cacheMetrics = values(mapObjIndexed(
      this.cacheToMetric,
      this.cacheMap,
    ))

    return [...systemMetrics, ...aggregateMetrics, ...aggregateDevMetrics, ...onFlushMetrics, ...cacheMetrics]
  }
}