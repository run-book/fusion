import { Lenses } from "@focuson/lens";

export type SelectionState = {
  route: string
}
export type DebugState = {
  devMode?: boolean
  debugTab?: string
}
export type FusionWorkbenchState = {
  selectionState: SelectionState
  debug?: DebugState
}

export const idL = Lenses.identity<FusionWorkbenchState> ()
export const routeL = idL.focusQuery ( 'selectionState' ).focusQuery ( 'route' )