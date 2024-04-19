import React from 'react';


import { addEventStoreListener, EventStore, eventStore, setEventStoreValue } from "@itsmworkbench/eventstore";
import { LensProps, lensState } from '@focuson/state';

import { createRoot } from 'react-dom/client';
import { DevMode, SizingContext, WorkbenchLayout } from "@fusionconfig/react_components";
import { rawConfigL, foldersO, FusionWorkbenchState, legalParamsL, paramsL, routeL, tagsL, configL } from "./state/fusion.state";
import { getQueryParams, makeSearchString, Route, RouteDebug, RouteProvider } from "@fusionconfig/react_routing";
import { FusionNav } from "./react/nav";
import { depData, dependentEngine, DependentItem, optionalTagStore, setJsonForDepData } from "@itsmworkbench/dependentdata";
import { hasErrors, mapObject, mapObjectValues, NameAnd, toArray } from "@laoban/utils";
import { FCLogRecord, futureCacheConsoleLog, futureCacheLog } from "@itsmworkbench/utils";
import { UrlStoreApiClientConfig, urlStoreFromApi } from "@itsmworkbench/browserurlstore";
import { NameSpaceDetails, UrlFolder } from "@itsmworkbench/urlstore";
import { YamlCapability } from "@itsmworkbench/yaml";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { allDomainDetails } from "@fusionconfig/alldomains";
import { DebugFolders } from "./playground/debug.folders";
import { ConfigFile } from "@fusionconfig/config";
import { objectToQueryString } from "@fusionconfig/utils";

const rootElement = document.getElementById ( 'root' );
if ( !rootElement ) throw new Error ( 'Failed to find the root element' );
const root = createRoot ( rootElement );
const yaml: YamlCapability = jsYaml ()
let rootUrl = "http://localhost:1235/";
const container: EventStore<FusionWorkbenchState> = eventStore<FusionWorkbenchState> ()
const nameSpaceDetails: NameAnd<NameSpaceDetails> = allDomainDetails ( yaml )

const urlStoreconfig: UrlStoreApiClientConfig = { apiUrlPrefix: rootUrl + "url", details: nameSpaceDetails }
const urlStore = urlStoreFromApi ( urlStoreconfig )

const logForDeps: FCLogRecord<any, any>[] = []
const tagStore = optionalTagStore ( tagsL );
const depEngine = dependentEngine<FusionWorkbenchState> (
  { listeners: [ futureCacheLog ( logForDeps ), futureCacheConsoleLog ( 'fc -' ) ], cache: {} },
  tagStore )

const dirList = depData ( 'dirlist', foldersO, {
  clean: 'leave',
  tag: ( o: UrlFolder ) => o?.name,
  load: async (): Promise<UrlFolder> => {
    const folders = await urlStore.folders ( "org", "schema" )
    if ( hasErrors ( folders ) ) throw new Error ( 'Failed to load ticketList\n' + folders.join ( '\n' ) )
    return folders
  }
} )

const legalParams = depData ( 'legalParams', legalParamsL, {
  clean: 'leave',
  tag: ( o: NameAnd<string[]> ) => JSON.stringify ( o ),
  load: async (): Promise<NameAnd<string[]>> => {
    const response = await fetch ( `${rootUrl}/axes/global.yaml` );
    if ( response.status >= 400 ) throw new Error ( `Failed to load parameters\n${response.statusText}` )
    const json: any = await response.json ()
    return json
  }
} )

const params = depData ( 'params', paramsL, legalParams, {
  tag: ( o: NameAnd<string> ) => JSON.stringify ( o ),
  load: async ( legalParams: NameAnd<string[]> ): Promise<NameAnd<string>> => {
    const parameters = getQueryParams ( window.location.search )
    return Object.keys ( parameters ).length === 0 ?
      mapObject ( legalParams, ( v, name ) => v[ 0 ] ) :
      parameters;

  },
  clean: ( legalParams ) => {
    if ( legalParams === undefined ) return undefined as any
    return mapObject ( legalParams, ( v, name ) => v[ 0 ] );
  },
} )

const rawConfig = depData ( 'rawConfig', rawConfigL, params, {
  clean: 'leave',
  tag: ( o: string ) => o?.substring ( 0, 100 ),
  load: async ( ps: NameAnd<string> ): Promise<string> => {
    const params = objectToQueryString ( ps )
    const paramString = params ? `?${params}` : ''
    const response = await fetch ( `${rootUrl}/fusion/global.yaml${paramString}`, {} );
    if ( response.status >= 400 ) throw new Error ( `Failed to load parameters\n${response.statusText}` )
    return await response.text ()
  }
} )

const config = depData ( 'config', configL, rawConfig, {
  clean: 'leave',
  tag: ( o: ConfigFile ) => o === undefined ? undefined : 'config',
  load: async ( raw: string ): Promise<ConfigFile> => yaml.parser ( raw )
} )

const route = depData ( 'route', routeL, params, {
  clean: ( params: NameAnd<string> ) => {
    const rawSearchString = makeSearchString ( params )
    const search = rawSearchString ? `?${rawSearchString}` : ''
    return `/${search}`;
  },
  tag: ( o: string ) => o
} )

const deps: DependentItem<FusionWorkbenchState, any> [] = [ dirList, legalParams, params, rawConfig, config, route ]

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
  delay: 500,

} )
// const setJson = setEventStoreValue ( container );
addEventStoreListener ( container, (( _, s ) => {
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
          <Route path='/folders'><DebugFolders state={state.focusOn ( 'folders' )}/></Route>
          {devMode && <DevMode state={state.focusOn ( 'debug' ).focusOn ( 'debugTab' )}
                               extra={{ route: <RouteDebug/> }}
                               titles={[ 'selectionState', 'folders', 'rawConfig', 'legal_parameters', 'parameters', 'config', 'tags', 'depDataLog', 'debug' ]}/>}
        </WorkbenchLayout>
      </SizingContext.Provider>
    </RouteProvider>)
}

let parameters: NameAnd<string> | undefined = getQueryParams ( window.location.search )
if ( Object.keys ( parameters ).length === 0 ) parameters = undefined
setJson ( {
  selectionState: { route: window.location.pathname + window.location.search },
  parameters,
  tags: {}, depDataLog: [],
  debug: { depData: true },

} )
