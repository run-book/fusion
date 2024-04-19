import { Lenses, Optional } from "@focuson/lens";
import { NameAnd, } from "@laoban/utils";
import { FCLogRecord } from "@itsmworkbench/utils";
import { UrlFolder } from "@itsmworkbench/urlstore"
import { DiTag } from "@itsmworkbench/dependentdata";
import { ConfigFile } from "@fusionconfig/config";

export type SelectionState = {
  route: string
  task?: string
  service?: string
}
export type DebugState = {
  devMode?: boolean
  debugTab?: string
  depData?: boolean
}
export type ConfigLegalData = {
  legalTasks: string[]
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
  config?: ConfigFile
  configLegalData?: ConfigLegalData
}

export const idL = Lenses.identity<FusionWorkbenchState> ()
let selectionL = idL.focusQuery ( 'selectionState' );
export const taskL = selectionL.focusQuery ( 'task' )
export const routeL: Optional<FusionWorkbenchState, string> = selectionL.focusQuery ( 'route' )
export const tagsL = idL.focusQuery ( 'tags' )
export const foldersO = idL.focusQuery ( 'folders' )
export const legalParamsL: Optional<FusionWorkbenchState, NameAnd<string[]>> = idL.focusQuery ( 'legal_parameters' )
export const paramsL: Optional<FusionWorkbenchState, NameAnd<string>> = idL.focusQuery ( 'parameters' )
export const rawConfigL: Optional<FusionWorkbenchState, string> = idL.focusQuery ( 'rawConfig' )
export const configL: Optional<FusionWorkbenchState, ConfigFile> = idL.focusQuery ( 'config' )

export const configLegalDataL = idL.focusQuery ( 'configLegalData' )
export const configLegalTasksL = configLegalDataL.focusQuery ( 'legalTasks' )
