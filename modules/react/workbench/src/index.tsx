import React from 'react';


import { addEventStoreListener, EventStore, eventStore, setEventStoreValue } from "@itsmworkbench/eventstore";
import { LensProps, lensState } from '@focuson/state';

import { createRoot } from 'react-dom/client';
import { DevMode, SizingContext, WorkbenchLayout } from "@fusionconfig/react_components";
import { FusionWorkbenchState, routeL } from "./state/fusion.state";
import { Route, RouteDebug, RouteProvider } from "@fusionconfig/react_routing";
import { FusionNav } from "./react/nav";

const rootElement = document.getElementById ( 'root' );
if ( !rootElement ) throw new Error ( 'Failed to find the root element' );
const root = createRoot ( rootElement );

const container: EventStore<FusionWorkbenchState> = eventStore<FusionWorkbenchState> ()
const setJson = setEventStoreValue ( container );
addEventStoreListener ( container, (( _, s, setJson ) => {
  const state = lensState ( s, setJson, 'state', {} )
  return root.render ( <App state={state}/> );
}) )

function App ( { state }: LensProps<FusionWorkbenchState, FusionWorkbenchState, any> ) {
  const devMode = state.optJson ()?.debug?.devMode;
  return (
    <RouteProvider state={state.copyWithLens(routeL)}>
      <SizingContext.Provider value={{ leftDrawerWidth: '240px', rightDrawerWidth: '240px' }}>
        <WorkbenchLayout
          title='Fusion Workbench'
          Nav={<FusionNav state={state}/>}
          Details={<div>Details</div>}>
          <Route path='/'>Route <RouteDebug/></Route>
          {devMode && <DevMode state={state.focusOn ( 'debug' ).focusOn ( 'debugTab' )} titles={[ 'selectionState', 'debug' ]}/>}
        </WorkbenchLayout>
      </SizingContext.Provider>
    </RouteProvider>)
}

setJson ( { selectionState: { route: window.location.pathname } } )
