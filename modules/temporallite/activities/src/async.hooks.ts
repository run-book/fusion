import { AsyncLocalStorage } from "async_hooks";
import { ReplayState } from "./replay.state";
import { IncMetric } from "./metrics";


export type MetricHookState = {
  incMetric: IncMetric
}
export type WorkspaceHookState = MetricHookState & {
  workflowId: string
  workflowInstanceId: string
  replayState: ReplayState
  currentReplayIndex: number
  updateCache: ( activityId: string, t: any ) => void,
  updateCacheWithError: ( activityId: string, error: any ) => Promise<void>
}

export const workspaceHookState = new AsyncLocalStorage<WorkspaceHookState> ()

export function useWorkspaceHookState (): WorkspaceHookState {
  return workspaceHookState.getStore ()
}
export function useMetricHookState (): IncMetric {
  return workspaceHookState.getStore ().incMetric
}