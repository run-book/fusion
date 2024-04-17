import { LensProps } from "@focuson/state";

import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import React from "react";
import { Box } from "@mui/material";
import { FusionWorkbenchState } from "../state/fusion.state";
import { FocusOnSetValueButton, FocusOnToggleButton } from "@fusionconfig/react_components";


export function FusionNav<S> ( { state }: LensProps<S, FusionWorkbenchState, any> ) {
  const buttonSx = {
    justifyContent: 'flex-start',
    textAlign: 'left',
    width: '100%',
  };


  const devMode = state.optJson ()?.debug?.devMode;

  return <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2, // Adjust the gap size to your preference
      p: 1, // Adds padding around the entire container
    }}
  >

    <FocusOnToggleButton aria-label='Toggle Developer Mode' startIcon={<DeveloperModeIcon/>} state={state.focusOn ( 'debug' ).focusOn ( 'devMode' )} sx={buttonSx}>Developer Mode</FocusOnToggleButton>
    {devMode && <>
        <div>Dev Mode</div>
      {/*<FocusOnSetValueButton aria-label='Debug Variables'*/}
      {/*                       valueToSet={{ workspaceTab: 'debugVariables' }}*/}
      {/*                       state={state.focusOn ( 'debug' ).focusOn ( 'debugTab' )} sx={buttonSx}>Debug Variables</FocusOnSetValueButton>*/}
      {/*<FocusOnSetValueButton aria-label='Debug Events' startIcon={<EventIcon/>} valueToSet={{ workspaceTab: 'debugEvents' }} state={tabsState} sx={buttonSx}>Debug Events</FocusOnSetValueButton>*/}
      {/*<FocusOnSetValueButton aria-label='Debug Enriched Events' startIcon={<EventIcon/>} valueToSet={{ workspaceTab: 'debugEnrichedEvents' }} state={tabsState} sx={buttonSx}>Debug Enriched Events</FocusOnSetValueButton>*/}
      {/*<FocusOnSetValueButton aria-label='Chat' startIcon={<ChatIcon/>} valueToSet={{ workspaceTab: 'chat' }} state={tabsState} sx={buttonSx}>Chat</FocusOnSetValueButton>*/}
    </>}
  </Box>
}