import React from 'react';


import { addEventStoreListener, EventStore, eventStore, setEventStoreValue } from "@itsmworkbench/eventstore";
import { LensProps, lensState } from '@focuson/state';

import { createRoot } from 'react-dom/client';
import { DevMode, SizingContext, WorkbenchLayout } from "@fusionconfig/react_components";
import { FusionWorkbenchState, routeL, tagsL } from "./state/fusion.state";
import { Route, RouteDebug, RouteProvider } from "@fusionconfig/react_routing";
import { FusionNav } from "./react/nav";
import { depData, dependentEngine, DependentItem, optionalTagStore, setJsonForDepData } from "@itsmworkbench/dependentdata";
import { toArray } from "@laoban/utils";
import { FCLogRecord, futureCacheLog, futureCacheConsoleLog } from "@itsmworkbench/utils";

const rootElement = document.getElementById ( 'root' );
if ( !rootElement ) throw new Error ( 'Failed to find the root element' );
const root = createRoot ( rootElement );

const container: EventStore<FusionWorkbenchState> = eventStore<FusionWorkbenchState> ()

const logForDeps: FCLogRecord<any, any>[] = []
const tagStore = optionalTagStore ( tagsL );
const depEngine = dependentEngine<FusionWorkbenchState> (
  { listeners: [ futureCacheLog ( logForDeps ), futureCacheConsoleLog ( 'fc -' ) ], cache: {} },
  tagStore.currentValue )

const deps: DependentItem<FusionWorkbenchState, any>[] = []

const setJson = setJsonForDepData ( depEngine, () => container.state, setEventStoreValue ( container ) ) ( deps, {
  setTag: ( s, name, tag ) => { // could do it with optional, but don't need to
    s.tags[ name ] = tag
    return s
  },
  updateLogs: s => {
    s.depDataLog = [ ...toArray ( s.depDataLog ), ...logForDeps ]
    logForDeps.length = 0
    return s
  },
  debug: () => container.state?.debug?.depData,
  delay: 100
} )
// const setJson = setEventStoreValue ( container );
addEventStoreListener ( container, (( _, s, setJson ) => {
  const state = lensState ( s, setJson, 'state', {} )
  return root.render ( <App state={state}/> );
}) )

function App ( { state }: LensProps<FusionWorkbenchState, FusionWorkbenchState, any> ) {
  const devMode = state.optJson ()?.debug?.devMode;
  return (
    <RouteProvider state={state.copyWithLens ( routeL )}>
      <SizingContext.Provider value={{ leftDrawerWidth: '240px', rightDrawerWidth: '240px' }}>
        {/*<RouteDebug/>*/}
        <WorkbenchLayout
          title='Fusion Workbench'
          Nav={<FusionNav state={state}/>}
          Details={<div>Details</div>}>
          {/*<Route path='/as'>Route <RouteDebug/></Route>*/}
          {devMode && <DevMode state={state.focusOn ( 'debug' ).focusOn ( 'debugTab' )}
                               extra={{ route: <RouteDebug/> }}
                               titles={[ 'selectionState', 'depDataLog', 'debug' ]}/>}
        </WorkbenchLayout>
      </SizingContext.Provider>
    </RouteProvider>)
}

setJson ( { selectionState: { route: window.location.pathname + window.location.search }, tags: {}, depDataLog: [] } )
