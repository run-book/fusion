import { Lenses } from "@focuson/lens";
import { NameAnd, } from "@laoban/utils";
import { FCLogRecord } from "@itsmworkbench/utils";
import { DiTag } from "@itsmworkbench/dependentdata";

export type SelectionState = {
  route: string
}
export type DebugState = {
  devMode?: boolean
  debugTab?: string
  depData?: boolean
}
export type FusionWorkbenchState = {
  selectionState: SelectionState
  debug?: DebugState
  tags: NameAnd<DiTag>,
  depDataLog: FCLogRecord<any, any>[],

}

export const idL = Lenses.identity<FusionWorkbenchState> ()
export const routeL = idL.focusQuery ( 'selectionState' ).focusQuery ( 'route' )
export const tagsL = idL.focusQuery ( 'tags' )