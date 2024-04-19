import { configLegalTasksL, FusionWorkbenchState, taskL } from "../state/fusion.state";
import { LensProps } from "@focuson/state";
import { HideNavButton } from "@fusionconfig/react_components/src/buttons/hide.nav.button";
import { Loading, SingleSelect } from "@fusionconfig/react_components";
import React from "react";
import { splitAndCapitalize } from "@itsmworkbench/utils";

export type FusionDetailsProps<S> = LensProps<S, FusionWorkbenchState, any> & {}
export function FusionDetails<S> ( { state }: FusionDetailsProps<S> ) {
  const fws = state.optJson ()
  const task = fws?.selectionState?.task
  const selectTaskTitle = task ? `Selected Task: ${splitAndCapitalize(task)}` : 'No Selected Task'
  return <>
    <HideNavButton title={selectTaskTitle}><Loading state={state.focusOn ( 'config' ).focusOn ( 'tasks' ).focusOn ( task || '' )}>{s =>
      <pre>{JSON.stringify ( s.optJson (), null, 2 )}</pre>}</Loading></HideNavButton>
    <HideNavButton title='Main config'><Loading state={state.focusOn ( 'rawConfig' )}>{s =>
      <pre>{s.optJson ()}</pre>}</Loading></HideNavButton>
  </>

}