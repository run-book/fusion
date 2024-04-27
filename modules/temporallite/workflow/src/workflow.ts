import { ActivityEvent, ActivityEvents, runWithWorkflowHookState, WorkflowHookState } from "@fusionconfig/activities";
import { IncMetric } from "@fusionconfig/activities/src/metrics";

export type WorkflowEngine = {
  incMetric: IncMetric
  nextInstanceId: ( workflowId: string ) => Promise<string>
  existingState: ( id: string ) => Promise<ActivityEvents>
  updateCache: ( e: ActivityEvent ) => Promise<void>
}

export type WorkflowCommon = {
  id: string
}
export type Workflow0<T> = WorkflowCommon & (( engine: WorkflowEngine ) => Promise<T>)
export type Workflow1<P1, T> = WorkflowCommon & (( engine: WorkflowEngine, p1: P1 ) => Promise<T>)
export type Workflow2<P1, P2, T> = WorkflowCommon & (( engine: WorkflowEngine, p1: P1, p2: P2 ) => Promise<T>)
export type Workflow3<P1, P2, P3, T> = WorkflowCommon & (( engine: WorkflowEngine, p1: P1, p2: P2, p3: P3 ) => Promise<T>)
export type Workflow4<P1, P2, P3, P4, T> = WorkflowCommon & (( engine: WorkflowEngine, p1: P1, p2: P2, p3: P3, p4: P4 ) => Promise<T>)
export type Workflow5<P1, P2, P3, P4, P5, T> = WorkflowCommon & (( engine: WorkflowEngine, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5 ) => Promise<T>)

export type Workflow<T> = Workflow0<T> | Workflow1<any, T> | Workflow2<any, any, T> | Workflow3<any, any, any, T> | Workflow4<any, any, any, any, T> | Workflow5<any, any, any, any, any, T>

export function workflow<T> ( common: WorkflowCommon, fn: ( ) => Promise<T> ): Workflow0<T>
export function workflow<P1, T> ( common: WorkflowCommon, fn: (p1: P1 ) => Promise<T> ): Workflow1<P1, T>
export function workflow<P1, P2, T> ( common: WorkflowCommon, fn: (  p1: P1, p2: P2 ) => Promise<T> ): Workflow2<P1, P2, T>
export function workflow<P1, P2, P3, T> ( common: WorkflowCommon, fn: (  p1: P1, p2: P2, p3: P3 ) => Promise<T> ): Workflow3<P1, P2, P3, T>
export function workflow<P1, P2, P3, P4, T> ( common: WorkflowCommon, fn: ( p1: P1, p2: P2, p3: P3, p4: P4 ) => Promise<T> ): Workflow4<P1, P2, P3, P4, T>
export function workflow<P1, P2, P3, P4, P5, T> ( common: WorkflowCommon, fn: (  p1: P1, p2: P2, p3: P3, p4: P4, p5: P5 ) => Promise<T> ): Workflow5<P1, P2, P3, P4, P5, T>
export function workflow<T> ( common: WorkflowCommon, fn: (  ...args: any[] ) => Promise<T> ): any {
  const newFn = async ( engine, ...args: any[] ) => {
    const workflowId = common.id;
    const replayState = await engine.existingState ( workflowId );
    const { updateCache, incMetric, nextInstanceId } = engine
    const workflowInstanceId = await nextInstanceId ( common.id )
    const store: WorkflowHookState = {
      currentReplayIndex: 0, workflowId, workflowInstanceId, incMetric,
      replayState: replayState, updateCache
    }
    return runWithWorkflowHookState ( store, () => fn (  ...args ) )
  }
  newFn[ 'id' ] = common.id
  return newFn as Workflow<T>
}



