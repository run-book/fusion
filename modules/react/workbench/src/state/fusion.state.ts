import { Lenses, Optional } from "@focuson/lens";
import { ErrorsAnd, NameAnd, } from "@laoban/utils";
import { FCLogRecord } from "@itsmworkbench/utils";
import { ListNamesResult, UrlFolder } from "@itsmworkbench/urlstore"
import { DiTag } from "@itsmworkbench/dependentdata";
import { ConfigFile } from "@fusionconfig/config";

export type ReqRespTx = 'Summary' |
  'Summary' |
  'TaskRequestInput' | 'RequestTranform' | 'ServiceRequestInput' |
  'ServiceResponseOutput' | 'ResponseTransform' | 'TaskResponseOutput'

export const reqRespOptions: ReqRespTx[] = [
  'Summary',
  'TaskRequestInput', 'RequestTranform', 'ServiceRequestInput',
  'ServiceResponseOutput', 'ResponseTransform', 'TaskResponseOutput',
]
export const taskRequestInput: ReqRespTx = 'TaskRequestInput'
export const requestTranform: ReqRespTx = 'RequestTranform'
export const serviceRequestInput: ReqRespTx = 'ServiceRequestInput'
export const serviceResponseOutput: ReqRespTx = 'ServiceResponseOutput'
export const responseTransform: ReqRespTx = 'ResponseTransform'
export const taskResponseOutput: ReqRespTx = 'TaskResponseOutput'



export type SelectionState = {
  route?: string
  task?: string
  requestResponse?: ReqRespTx
}
export type DebugState = {
  devMode?: boolean
  debugTab?: string
  depData?: boolean
}
export type ConfigData = {
  legalTasks: string[]
}

export type Tests = {
  inputRequestTests: ErrorsAnd<ListNamesResult>
  outputRequestTests:  ErrorsAnd<ListNamesResult>
  inputResponseTests:  ErrorsAnd<ListNamesResult>
  outputResponseTests:  ErrorsAnd<ListNamesResult>

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
  tests?: Tests
}

export const idL = Lenses.identity<FusionWorkbenchState> ()
let selectionL = idL.focusQuery ( 'selectionState' );
export const taskL = selectionL.focusQuery ( 'task' )
export const testL = idL.focusQuery ( 'tests' )
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
