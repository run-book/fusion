import { DepDataFortest, fetchParamsAction, fetchParamsDefAction, fetchTaskListAction, someParamsDef, someTasks } from "./dependent.data.fixture";
import { DiRequest, doActions, StateAndWhyWillChange, StateAndWhyWontChange, uncachedSendRequestForFetchAction } from "./dependant.execute";
import { globalTagStore, globalTagStoreCurrentValue } from "./tag.store";
import { NameAnd } from "@laoban/utils";
import { DiTag } from "./tag";

const paramsDefDa_clean_is_nuke = fetchParamsDefAction ( {}, someParamsDef )
const paramsAction_clean_first = fetchParamsAction ( { value: [ 'c1', 'c2', 'c3' ], tag: 'c1/c2/c3' } )
const taskListDa_clean_is_nuke = fetchTaskListAction ( {}, someTasks )
describe ( "uncachedSendRequestForFetchAction", () => {
  describe ( "when no upstream", () => {
    test ( "when the underlying data hasn't changed", async () => {
      const resP: Promise<DiRequest<DepDataFortest>> = uncachedSendRequestForFetchAction ( [], () => paramsDefDa_clean_is_nuke.tag ) ( paramsDefDa_clean_is_nuke ) ()
      const res = await resP
      const stateAndWhy = res ( {} )
      const { s, changed, why } = stateAndWhy as StateAndWhyWillChange<DepDataFortest>
      expect ( s ).toEqual ( { paramLists: someParamsDef } )
      expect ( changed ).toBe ( true )
      expect ( why ).toBe ( "Loaded paramsList" )
    } )
    test ( "even when some manually changed it (tag and value both changed) -we overwrite those changes", async () => {
      const resP: Promise<DiRequest<DepDataFortest>> = uncachedSendRequestForFetchAction ( [],
        () => 'changed' ) ( paramsDefDa_clean_is_nuke ) ()
      const res = await resP

      const stateAndWhy = res ( { paramLists: { geo: [ 'manual' ], product: [ 'ly' ], ch: [ 'set' ] } } )
      const { s, changed, why } = stateAndWhy as StateAndWhyWillChange<DepDataFortest>
      expect ( s ).toEqual ( { paramLists: someParamsDef } )
      expect ( changed ).toBe ( true )
      expect ( why ).toBe ( "Loaded paramsList" )
    } )
  } )
  describe ( "when has upstream", () => {
    test ( "when the upstream data hasn't changed", async () => {
      const upstreamTags: NameAnd<DiTag> = {
        params: 'uk/cc/web'//unchanged
      };
      const resP: Promise<DiRequest<DepDataFortest>> = uncachedSendRequestForFetchAction ( [], globalTagStoreCurrentValue ( upstreamTags ) ) ( taskListDa_clean_is_nuke ) ()
      const res = await resP
      const stateAndWhy = res ( { service: 'something', taskList: [ 'old', 'list' ] } )
      const { s, changed, why } = stateAndWhy as StateAndWhyWillChange<DepDataFortest>
      expect ( s ).toEqual ( { service: 'something', taskList: someTasks } )
      expect ( changed ).toBe ( true )
      expect ( why ).toBe ( "Loaded taskList" )
    } )

    test ( "when the upstream data has changed", async () => {
      const upstreamTags: NameAnd<DiTag> = {
        params: 'uk/cc/newvalue'//changed
      };
      const tagGetter = globalTagStoreCurrentValue ( upstreamTags );
      const resP: Promise<DiRequest<DepDataFortest>> = uncachedSendRequestForFetchAction ( [], tagGetter ) ( taskListDa_clean_is_nuke ) ()
      const res = await resP
      const stateAndWhy = res ( { service: 'something', taskList: [ 'old', 'list' ] } )
      const { changed, why } = stateAndWhy as StateAndWhyWontChange<DepDataFortest>
      expect ( changed ).toBe ( false )
      expect ( why ).toBe ( "Changed params" )
    } )
  } )
} )

describe ( "doActions", () => {
  const upstreamTags: NameAnd<DiTag> = { params: 'uk/cc/web' };
  let tagStore = globalTagStore ( { ...upstreamTags } );

  const changedUpstreamTags: NameAnd<DiTag> = { params: 'globalTagStore/cc/changed' };
  let changeTagStore = globalTagStore ( { ...changedUpstreamTags } );

  const actions = [ paramsDefDa_clean_is_nuke, paramsAction_clean_first, taskListDa_clean_is_nuke ]

  beforeEach ( () => {
    tagStore = globalTagStore ( { ...upstreamTags } );
    changeTagStore = globalTagStore ( { ...changedUpstreamTags } );

  } )
  it ( "should return a new state which is all the cleans", () => {
    const startState: DepDataFortest = { paramLists: { a: [ 'a' ] }, params: { a: 'a' }, taskList: [ 't1' ], task: 't1' }
    const res = doActions ( { listeners: [], cache: {} }, tagStore ) ( actions )
    expect ( res.newS ( startState ) ).toEqual ( {
      "params": [ "c1", "c2", "c3" ],
      "task": "t1"
    } )
  } )
  it ( "should return updates that apply the results of the fetches when no upstream tags changed", async () => {
    const startState: DepDataFortest = { paramLists: { a: [ 'a' ] }, params: { a: 'a' }, taskList: [ 't1' ], task: 't1' }
    const res = doActions ( { listeners: [], cache: {} }, tagStore ) ( actions )
    expect ( res.newS ( startState ) ).toEqual ( {
      "params": [ "c1", "c2", "c3" ],
      "task": "t1"
    } )
    expect ( res.updates.length ).toBe ( 2 )
    const [ update1, update2, update3 ] = res.updates
    expect ( (await update1) ( {} ) ).toEqual ( {
      "name": "paramsList",
      "changed": true,
      "s": {
        "paramLists": someParamsDef
      },
      "t": someParamsDef,
      "tag": "3/2/2",
      "why": "Loaded paramsList"
    } )
    expect ( (await update2) ( startState ) ).toEqual ( {
      "changed": true,
      "name": "taskList",
      "s": {
        "paramLists": { "a": [ "a" ] },
        "params": { "a": "a" },
        "task": "t1",
        "taskList": [ "t1", "t2", "t3" ]
      },
      "t": [ "t1", "t2", "t3" ],
      "tag": [ "t1", "t2", "t3" ],
      "why": "Loaded taskList"
    } )
  } )
  it ( "should return updates that apply the results of the fetches when upstream tags changed", async () => {
    const startState: DepDataFortest = { paramLists: { a: [ 'a' ] }, params: { a: 'a' }, taskList: [ 't1' ], task: 't1' }
    const res = doActions ( { listeners: [], cache: {} }, tagStore ) ( actions )
    expect ( res.newS ( startState ) ).toEqual ( {
      "params": [ "c1", "c2", "c3" ],
      "task": "t1"
    } )
    expect ( res.updates.length ).toBe ( 2 )
    const [ update1, update2, update3 ] = res.updates
    expect ( (await update1) ( {} ) ).toEqual ( {
      "name": "paramsList",
      "changed": true,
      "s": {
        "paramLists": someParamsDef
      },
      "t": someParamsDef,
      "tag": "3/2/2",
      "why": "Loaded paramsList"
    } )
    expect ( (await update2) ( startState ) ).toEqual ( {
      "changed": false,
      "name": "taskList",
      "t": [
        "t1",
        "t2",
        "t3"
      ],
      "why": "Changed params"
    } )
  } )
} )



