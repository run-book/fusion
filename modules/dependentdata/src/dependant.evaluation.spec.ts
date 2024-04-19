import { DiValuesAndTags, evaluateDependentItem } from "./dependant.evaluation";
import { globalTagStoreCurrentValue } from "./tag.store";
import { comparableDi, DepDataFortest, paramDi, paramsListDefDi, someParams, someParamsDef, taskListDi } from "./dependent.data.fixture";
import { DiAction, isFetchDiAction } from "./di.actions";

function comparableDiAction<S, T> ( d: DiAction<S, T> ) {
  const load = (d as any).load
  return {
    ...d, di: d.di.name,
    load: typeof load === 'function' ? 'function' : JSON.stringify ( load ),
    clean: typeof d.clean === 'function' ? 'function' : d.clean
  }
}
function comparableDiActions<S, T> ( ds: DiAction<S, T>[] ) {
  return ds.map ( comparableDiAction )
}
describe ( "evaluateDependentItem", () => {
  describe ( 'No upstream actions', () => {
    test ( `when undefined`, () => {
      const getTag = globalTagStoreCurrentValue ( {} )
      const status = {};
      const vAndT = {};
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, {} )
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( paramsListDefDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [
        { "clean": {}, "di": "paramsList", "load": "function", "reason": "thisTagUndefinedHaveLoadFn", tags: [] } ] ) //clean means that the value and tag are both undefined
      expect ( status ).toEqual ( {} ) // telling downstreams that we are undefined
      expect ( vAndT ).toEqual ( { "paramsList": {} } )
    } )
    test ( `when have a value, should not do anything`, () => {
      const getTag = globalTagStoreCurrentValue ( {} )
      const status = {};
      const vAndT = {};
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, { paramLists: someParamsDef } )
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( paramsListDefDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [] ) //Because we have no upstreams and have a value, don't need to do anything
      expect ( status ).toEqual ( { "paramsList": false } ) // telling downstreams that we are not dirty
      expect ( vAndT ).toEqual ( {
        "paramsList": {
          "tag": "3/2/2",
          "value": someParamsDef
        }
      } ) // any downstreams that needs our value as a param can get it easily
    } )
  } )

  describe ( 'one upstream action', () => {
    test ( `(1)upstream is undefined (2) no load fn (3) tag and current value match (4) current value is clean  ==> do nothing`, () => {
      const getTag = globalTagStoreCurrentValue ( {} )
      const status = { params: undefined, junk: true };//everything upstream is undefined. Junk here referes to something not relevant
      const vAndT: DiValuesAndTags = { params: {} }; //value and tag are both undefined
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, {} )
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( taskListDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [] )
      expect ( status ).toEqual ( { "junk": true } ) // telling downstreams that we are undefined
      expect ( vAndT ).toEqual ( {
        "params": {}, //here at start
        "taskList": {} // our current value
      } )
    } )
    test ( `(1)upstream is undefined (2) no load fn (3) tag and current value  unimportant  ==> we need to clean`, () => {
      const getTag = globalTagStoreCurrentValue ( { taskList: [ 'some', 'value' ] } )
      const status = { params: undefined, junk: true };//everything upstream is undefined. Junk here referes to something not relevant
      const vAndT: DiValuesAndTags = { params: {} }; //value and tag are both undefined
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, { taskList: [ 'some', 'value' ] } )
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( taskListDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [
        { "clean": {}, "di": "taskList", "reason": "someUpstreamIsUndefinedNoLoadFnButNeedToClean", }
      ] )
      expect ( status ).toEqual ( {
        "junk": true,
        "taskList": true
      } ) // telling downstreams that we are 'dirty' and need to be cleaned
      expect ( vAndT ).toEqual ( {
        "params": {},
        "taskList": {
          "lastTag": [ "some", "value" ],
          "tag": [ "some", "value" ],
          "value": [ "some", "value" ]
        }
      } )
    } )
    test ( `(1)upstream is defined, and have not changed (2)  load fn (3) have a current value (4) tag and current value don't match (unimportant) ===> do nothing`, () => {
      const getTag = globalTagStoreCurrentValue ( {
        params: 'paramTag',
        taskList: [ 'some', 'diff', 'value' ]
      } ) //different
      const status = { params: false, junk: true };//params is not dirty
      const vAndT: DiValuesAndTags = { params: { value: 'whocares', lastTag: 'paramTag', tag: 'paramTag' } }; //These aren't actual values. Because we don't check that...
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, { taskList: [ 'some', 'value' ] } ) //note we didn't put params in here. That is to force us to rely on the vAndT and status
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( taskListDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [] )
      expect ( status ).toEqual ( {
        "junk": true,
        "params": false,
        "taskList": false
      } )
      expect ( vAndT ).toEqual ( {
        "params": { "lastTag": "paramTag", "tag": "paramTag", "value": "whocares" },
        "taskList": {
          "lastTag": [ "some", "diff", "value" ],
          "tag": [ "some", "value" ],
          "value": [ "some", "value" ]
        }
      } )
    } )
    test ( `(1)upstream is defined, and HAS changed (2)  load fn (3) have a current value (4) tag and current value don't match (unimportant) ===> clean and load`, async () => {
      const getTag = globalTagStoreCurrentValue ( {
        taskList: [ 'some', 'diff', 'value' ]
      } ) //different
      const status = { params: false, junk: true };//params is not dirty
      const vAndT: DiValuesAndTags = { params: { value: someParams, lastTag: 'paramTagOld', tag: 'paramTagNew' } }; //These tags aren't actual values. Because we don't check that...
      const evaluate = evaluateDependentItem<DepDataFortest> ( getTag, status, vAndT, { taskList: [ 'some', 'value' ] } ) //note we didn't put params in here. That is to force us to rely on the vAndT and status
      const diActions: DiAction<DepDataFortest, any>[] = evaluate ( taskListDi )
      expect ( comparableDiActions ( diActions ) ).toEqual ( [
        {
          "clean": {},
          "di": "taskList",
          "load": "function",
          "reason": "upStreamChangedHaveLoadFn",
          "tag": [ "some", "value" ],
          "tags": [
            {
              "lastTag": "paramTagOld",
              "tag": "paramTagNew",
              "value": { "channel": "web", "geo": "uk", "product": "cc" }
            }
          ]
        }
      ] )
      expect ( status ).toEqual ( {
        "junk": true,
        "params": false,
        "taskList": true
      } )
      expect ( vAndT ).toEqual ( {
        "params": {
          "lastTag": "paramTagOld",
          "tag": "paramTagNew",
          "value": { "channel": "web", "geo": "uk", "product": "cc" }
        },
        "taskList": {
          "lastTag": [ "some", "diff", "value" ],
          "tag": [ "some", "value" ],
          "value": [ "some", "value" ]
        }
      } )
      const d = diActions[ 0 ]
      if ( !isFetchDiAction ( d ) ) throw new Error ( 'should have load' )
      expect ( await d.load () ).toEqual ( [
        "Task:geo,product,channel",
        "Task:uk,cc,web"
      ] )
    } )
  } )
} )