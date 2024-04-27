import { NameAnd } from "@laoban/utils";

export type IncMetric = ( metricName: string ) => void

export function inMemoryIncMetric ( metrics: NameAnd<number> ): IncMetric {
  return ( metricName: string ) => {
    if ( metrics[ metricName ] === undefined ) metrics[ metricName ] = 0
    metrics[ metricName ]++
  }
}
export const nullIncMetric: IncMetric = () => {}