import { Lenses, Optional } from "@focuson/lens";
import { ErrorsAnd, NameAnd, } from "@laoban/utils";
import { FCLogRecord } from "@itsmworkbench/utils";
import { ListNamesResult, UrlFolder } from "@itsmworkbench/urlstore"
import { DiTag } from "@itsmworkbench/dependentdata";
import { ConfigFile } from "@fusionconfig/config";
import { ReqRespAction } from "./test.selection";
import { RunTestsDefn, TestsResult } from "@fusionconfig/tests";


export type SelectionState = {
  route?: string
  task?: string
  requestResponse?: ReqRespAction
  testName?: string
}
export type DebugState = {
  devMode?: boolean
  debugTab?: string
  depData?: boolean
}
export type ConfigData = {
  legalTasks: string[]
}

export interface NameAndId {
  name: string
  id: string
}

export interface TaskRequestOrResponse {
  topic: string
  kafka: NameAndId
  schema: NameAndId
  transformer: NameAndId
}
export interface Task {
  service: string
  variables: string | string[]
  taskDescription: string
  serviceDescription: string
  request: TaskRequestOrResponse
  response: TaskRequestOrResponse
}
export function taskToRunDefn ( task: Task ): RunTestsDefn {
  return {
    schema: { input: task.request.schema.name, output: task.request.kafka.name },
    transformer: task.request.transformer.name
  }
}


export interface FusionConfigFile extends ConfigFile {
  bpmn: string
  tasks: NameAnd<Task>
}

export type FusionWorkbenchState = {
  selectionState: SelectionState
  debug?: DebugState
  tags: NameAnd<DiTag>,
  depDataLog: FCLogRecord<any, any>[],
  folders?: UrlFolder
  legal_parameters?: NameAnd<string[]>
  parameters?: NameAnd<string>
  rawConfig?: string
  config?: FusionConfigFile
  configLegalData?: ConfigData
  tests?: ErrorsAnd<TestsResult>
}

export const idL = Lenses.identity<FusionWorkbenchState> ()
let selectionL = idL.focusQuery ( 'selectionState' );
export const taskL = selectionL.focusQuery ( 'task' )
export const testNameL = selectionL.focusQuery ( 'testName' )
export const testL: Optional<FusionWorkbenchState,ErrorsAnd<TestsResult>> = idL.focusQuery ( 'tests' )
export const requestResponseL = selectionL.focusQuery ( 'requestResponse' )
export const routeL: Optional<FusionWorkbenchState, string> = selectionL.focusQuery ( 'route' )
export const tagsL = idL.focusQuery ( 'tags' )
export const foldersO = idL.focusQuery ( 'folders' )
export const legalParamsL: Optional<FusionWorkbenchState, NameAnd<string[]>> = idL.focusQuery ( 'legal_parameters' )
export const paramsL: Optional<FusionWorkbenchState, NameAnd<string>> = idL.focusQuery ( 'parameters' )
export const rawConfigL: Optional<FusionWorkbenchState, string> = idL.focusQuery ( 'rawConfig' )
export const configL: Optional<FusionWorkbenchState, FusionConfigFile> = idL.focusQuery ( 'config' )

export const tasksL = configL.focusQuery ( 'tasks' )
export const configLegalDataL = idL.focusQuery ( 'configLegalData' )
export const configLegalTasksL = configLegalDataL.focusQuery ( 'legalTasks' )
