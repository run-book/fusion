import { ReplayState, workspaceHookState, WorkspaceHookState } from "@fusionconfig/activities";
import { IncMetric } from "@fusionconfig/activities/src/metrics";


export type Workflow = {
  id: string
  nextInstanceId: () => Promise<string>
  workflow: () => Promise<void>
}

export type WorkflowEngine = {
  incMetric: IncMetric
  existingState: ( id: string ) => Promise<ReplayState>
  updateCache: ( activityId: string, t: any ) => void,
  updateCacheWithError: ( activityId: string, error: any ) => Promise<void>
}

export async function runWorkflow ( engine: WorkflowEngine, workflow: Workflow ): Promise<void> {
  const workflowId = workflow.id;
  const replayState = await engine.existingState ( workflowId );
  const workflowInstanceId = await workflow.nextInstanceId ()
  const { updateCache, updateCacheWithError, incMetric } = engine
  const store: WorkspaceHookState = { currentReplayIndex: 0, workflowId, workflowInstanceId, incMetric, replayState: replayState, updateCache, updateCacheWithError }
  return workspaceHookState.run ( store, workflow.workflow )
}