import { MetricHookState } from "@fusionconfig/activities";
import { inMemoryIncMetric } from "@fusionconfig/activities";
import { NameAnd } from "@laoban/utils";
import fs from "fs";

export async function swapFiles ( file: string, newData: string ): Promise<void> {
  const tempFilePath = `${file}.tmp`;

  await fs.promises.writeFile ( tempFilePath, newData );
  await fs.promises.rename ( tempFilePath, file );
}


export function metricsOnFile ( filename: string ): MetricHookState {
  const metrics: NameAnd<number> = {}
  return {
    incMetric: inMemoryIncMetric ( metrics ),
    writeMetrics: async () =>
      swapFiles ( filename, JSON.stringify ( metrics ) )

  }

}
