import React from 'react';
import { addEventStoreListener, EventStore, eventStore, setEventStoreValue } from "@itsmworkbench/eventstore";
import { LensProps, lensState } from '@focuson/state';
import { createRoot } from 'react-dom/client';
import { DevMode, SizingContext, WorkbenchLayout } from "@fusionconfig/react_components";
import { configL, configLegalTasksL, foldersO, FusionConfigFile, FusionWorkbenchState, legalParamsL, paramsL, rawConfigL, requestResponseL, routeL, tagsL, taskL, testL, testNameL, Tests } from "./state/fusion.state";
import { getQueryParams, makeSearchString, Route, RouteDebug, RouteProvider, RouteVars } from "@fusionconfig/react_routing";
import { FusionNav } from "./react/nav";
import { depData, dependentEngine, DependentItem, optionalTagStore, setJsonForDepData } from "@itsmworkbench/dependentdata";
import { hasErrors, mapObject, NameAnd, toArray } from "@laoban/utils";
import { FCLogRecord, futureCacheConsoleLog, futureCacheLog } from "@itsmworkbench/utils";
import { UrlStoreApiClientConfig, urlStoreFromApi } from "@itsmworkbench/browserurlstore";
import { NameSpaceDetails, UrlFolder, UrlQuery } from "@itsmworkbench/urlstore";
import { YamlCapability } from "@itsmworkbench/yaml";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { allDomainDetails } from "@fusionconfig/alldomains";
import { DebugFolders } from "./playground/debug.folders";
import { objectToQueryString } from "@fusionconfig/utils";
import { FusionDetails } from "./react/details";
import { TaskDetailsPage } from "./react/task.details.page";
import { ReqRespAction, reqRespOptions } from "./state/test.selection";
import { schemaToTestQuery } from "@fusionconfig/tests";
import { parseNamedUrlOrThrow } from "@itsmworkbench/urlstore/dist/src/identity.and.name.url";


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
  clean: ( legalParams ) => {
    const fromUrl = getQueryParams ( window.location.search )
    if ( Object.keys ( fromUrl ).length > 0 ) return fromUrl
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
  tag: ( o: FusionConfigFile ) => o === undefined ? undefined : 'config',
  load: async ( raw: string ): Promise<FusionConfigFile> => yaml.parser ( raw )
} )


const legalTasks = depData ( 'configLegalData', configLegalTasksL, rawConfig, config, {
  tag: ( o: string[] ) => o,
  clean: ( rawConfig, config: any ) => config?.tasks === undefined ? undefined as any as string[] : Object.keys ( config?.tasks ),
} )

const task = depData ( 'task', taskL, {
  tag: ( o: string ) => o,
  clean: () => {
    const path = window.location.pathname
    if ( path.startsWith ( '/task/' ) ) return path.substring ( 6 )
    return undefined as any as string
  }
} )
const requestResponse = depData ( 'requestResponse', requestResponseL, {
  tag: ( o: ReqRespAction ) => o,
  clean: 'leave'
} )

async function loadOne ( query: UrlQuery ) {
  const res = urlStore.list ( query )
  if ( hasErrors ( res ) ) throw new Error ( res.join ( '\n' ) )
  return res
}
const tests = depData ( 'tests', testL, config, task, {
  tag: ( o: Tests ) => o ? 'tests' : undefined,
  clean: 'leave',
  load: async ( config, task ): Promise<Tests> => {
    const theTask = config.tasks[ task ]
    if ( theTask === undefined ) throw new Error ( `Task ${task} not found in config` )

    const inputRequestTests = await loadOne ( schemaToTestQuery ( parseNamedUrlOrThrow (theTask.request.kafka.name), "input_sample" ) )
    const outputRequestTests = await loadOne ( schemaToTestQuery (parseNamedUrlOrThrow ( theTask.request.kafka.name), "output_sample" ) )
    const inputResponseTests = await loadOne ( schemaToTestQuery (parseNamedUrlOrThrow ( theTask.response.kafka.name), "input_sample" ) )
    const outputResponseTests = await loadOne ( schemaToTestQuery ( parseNamedUrlOrThrow (theTask.response.kafka.name), "output_sample" ) )
    return { inputRequestTests, outputRequestTests, inputResponseTests, outputResponseTests }
  }
} )


const route = depData ( 'route', routeL, task, params, requestResponse, {
  tag: ( o: string ) => o,
  clean: ( task: string, params: NameAnd<string>, reqRes ) => {
    const rawSearchString = makeSearchString ( params )
    const search = params === undefined ? window.location.search : `?${rawSearchString}`
    const repResString = reqRes === undefined ? 'Summary' : `${reqRes}`
    const taskString = task ? `/task/${task}/${repResString}` : '/'
    return taskString + search
  },
} )


const deps: DependentItem<FusionWorkbenchState, any> [] = [ dirList, legalParams, params, rawConfig, config, legalTasks, task, requestResponse, tests, route ]

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
  const tasks = state.optJson ()?.config?.tasks
  const tests = state.optJson ()?.tests
  const tasksState = state.doubleUp ().withLens1 ( requestResponseL ).withLens2 ( testNameL )
  return (
    <RouteProvider state={state.copyWithLens ( routeL )}>
      <SizingContext.Provider value={{ leftDrawerWidth: '240px', rightDrawerWidth: '600px' }}>
        <WorkbenchLayout
          title='Fusion Workbench'
          Nav={<FusionNav state={state}/>}
          Details={<FusionDetails state={state}/>}>
          <Route path='/folders'><DebugFolders state={state.focusOn ( 'folders' )}/></Route>
          <RouteVars path='/task/{task}/{action}'>{
            ( { task } ) => <>
              <TaskDetailsPage task={task} tasks={tasks} tests={tests} state={tasksState}/>
            </>
          }</RouteVars>
          {devMode && <DevMode state={state.focusOn ( 'debug' ).focusOn ( 'debugTab' )}
                               extra={{ route: <RouteDebug/> }}
                               titles={[ 'selectionState', 'folders', 'rawConfig', 'legal_parameters', 'parameters', 'config', 'tests', 'configLegalData', 'tags', 'depDataLog', 'debug' ]}/>}
        </WorkbenchLayout>
      </SizingContext.Provider>
    </RouteProvider>)
}

let parameters: NameAnd<string> | undefined = getQueryParams ( window.location.search )
if ( Object.keys ( parameters ).length === 0 ) parameters = undefined
setJson ( {
  selectionState: { requestResponse: reqRespOptions[ 0 ] },
  parameters,
  tags: {}, depDataLog: [],
  debug: { depData: true },
} )
