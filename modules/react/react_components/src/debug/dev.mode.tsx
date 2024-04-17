import React from "react";
import { LensProps, LensState2 } from "@focuson/state";
import { toArray } from "@laoban/utils";
import { DisplayJson } from "./display.json";
import { SimpleTabPanel, TabsContainer } from "../layout/TabPanel";

//Focused on selected tab
export interface DevModeProps<S> extends LensProps<S, string, any> {
  maxHeight?: string
  maxWidth?: string
  titles: string[]
}
function makeDevPanels ( titles: string[], keyPrefix: string, maxWidth: string | undefined, maxHeight: string | undefined, main: any ) {
  if ( main === undefined ) return []
  return toArray ( titles ).map ( t => <SimpleTabPanel key={keyPrefix + t} title={t}><DisplayJson maxWidth={maxWidth} maxHeight={maxHeight} json={main?.[ t ]}/></SimpleTabPanel> );
}
export function DevMode<S> ( { state, titles, maxHeight, maxWidth }: DevModeProps<S> ) {
  const main: any = state.main;
  const full = <SimpleTabPanel key='full' title='Full'><DisplayJson maxWidth={maxWidth} maxHeight={maxHeight} json={main}/></SimpleTabPanel>
  const titlePanels = makeDevPanels ( titles, 'titles.', maxWidth, maxHeight, main )
  // const forTicketPanels = makeDevPanels ( forTicket, 'forTicket.', maxWidth, maxHeight, main?.forTicket )
  // const tempDataPanels = makeDevPanels ( tempData, 'temp.', maxWidth, maxHeight, main?.forTicket?.tempData )
  const panels = [ full, ...titlePanels ]//, ...forTicketPanels, ...tempDataPanels ]
  console.log ( 'panels', panels.length, panels.map ( p => p.props.title ) )
  const tabState: LensState2<S, string, string, any> = state.doubleUp ();
  return <TabsContainer label='Dev mode data' state={tabState} children={panels}/>
}
