import { mapObjectValues, NameAnd } from "@laoban/utils";
import { Lenses } from "@focuson/lens";
import { depData } from "./dep.data.dsl";
import { DependentItem, dependents } from "./dependent.data";
import { CleanDiAction, FetchDiAction } from "./di.actions";
import { ValueAndTag } from "./tag";

export type DepDataFortest = {
  paramLists?: NameAnd<string[]>
  params?: NameAnd<string>
  taskList?: string[]
  task?: string
  serviceList?: string[]
  service?: string
}
export const id = Lenses.identity<DepDataFortest> ( "I" )
export const paramListO = id.focusQuery ( 'paramLists' )
export const paramsO = id.focusQuery ( 'params' )
export const taskListO = id.focusQuery ( 'taskList' )
export const taskO = id.focusQuery ( 'task' )
export const serviceListO = id.focusQuery ( 'serviceList' )
export const serviceO = id.focusQuery ( 'service' )
export const someParamsDef: NameAnd<string[]> = { geo: [ 'uk', 'ch', 'sw' ], product: [ 'carLoan', 'cc' ], ch: [ 'web', 'assisted' ] }

export const someParams = { geo: 'uk', product: 'cc', channel: 'web' };
export const someTasks = [ 't1', 't2', 't3' ]
export const mockLoadParamLists = async (): Promise<NameAnd<string[]>> => someParamsDef

export const firstItems = ( params: NameAnd<string[]> ) => mapObjectValues ( params, v => v?.[ 0 ] )
export const mockLoadTaskList = async ( params: NameAnd<string> ): Promise<string[]> =>
  [ 'Task:' + Object.keys ( params ), 'Task:' + Object.values ( params ) ]
export const mockLoadServiceList = async ( params: NameAnd<string>, task: string ): Promise<string[]> =>
  [ 'Service:' + task + ":" + Object.keys ( params ), 'Service:' + task + ":" + Object.values ( params ) ]

const paramsListTag = ( p: NameAnd<string[]> ) => p === undefined ? undefined : (p?.geo?.length || 0) + '/' + (p?.product?.length || 0) + "/" + (p?.ch?.length || 0)
export const paramsListDefDi = depData ( 'paramsList', paramListO, {
  clean: "leave",
  tag: paramsListTag,
  load: mockLoadParamLists
} )
export const paramDi = depData ( 'params', paramsO, paramsListDefDi, { clean: firstItems } )
export const taskListDi = depData ( 'taskList', taskListO, paramDi, { clean: 'nuke', load: mockLoadTaskList } )
export const taskDi = depData ( 'task', taskO, taskListDi, { clean: 'nuke' } )
export const serviceListDi = depData ( 'serviceList', serviceListO, paramDi, taskDi, { clean: 'nuke', load: mockLoadServiceList } )
export const serviceDi = depData ( 'service', serviceO, paramDi, taskDi, serviceListDi, { clean: 'leave' } )

export const allDi = [
  paramDi, taskListDi, taskDi, serviceListDi, serviceDi
]
export function comparableDi<S, T> ( d: DependentItem<S, T> ) {
  let comparable = {
    ...d,
    hashFn: undefined,
    optional: d.optional.description,
    dependsOn: {
      ...d.dependsOn,
      deps: dependents ( d.dependsOn ).map ( d => d.name ),
      load: typeof d.dependsOn.load === 'function' ? 'function' : JSON.stringify ( d.dependsOn.load ),
      clean: typeof d.dependsOn.clean === 'function' ? 'function' : d.dependsOn.clean,
      dependentOn: undefined,
      dependentOn1: undefined,
      dependentOn2: undefined,
      dependentOn3: undefined
    }
  };
  return comparable
}

export function fetchParamsDefAction ( clean: ValueAndTag, data: NameAnd<string[]> ): FetchDiAction<DepDataFortest, NameAnd<string[]>> {
  return {
    di: paramsListDefDi,
    tags: [],//no upstreams
    tag: '1/1/1',
    load: async () => data,
    clean,
    reason: 'from test'
  }
}
export function fetchParamsAction ( clean: ValueAndTag ): CleanDiAction<DepDataFortest, NameAnd<string>> {
  return {
    di: paramDi,
    clean,
    reason: 'from test'
  }
}
export function fetchTaskListAction ( clean: ValueAndTag, data: string[] ): FetchDiAction<DepDataFortest, string[]> {
  return {
    di: taskListDi,
    tags: [ { tag: 'uk/cc/web', value: someParams } ],
    tag: [ 't1', 't2' ],
    load: async () => data,
    clean,
    reason: 'from test'
  }
}