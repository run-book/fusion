import { comparableDi, paramDi, paramsListDefDi, serviceDi, serviceListDi, someParams, someParamsDef, taskListDi } from "./dependent.data.fixture";
import { cleanValue, DependentItem, dependents, loadFn } from "./dependent.data";

describe ( 'Dependent Data dsl', () => {
  describe ( 'basics: ignoring functions', () => {
    it ( 'should create a zero dependencies correctly', () => {
      expect ( comparableDi ( paramsListDefDi ) ).toEqual ( {
        "dependsOn": {
          "clean": "leave",
          "deps": [],
          "load": "function",
          "root": true
        },
        "name": "paramsList",
        "optional": "I.focus?(paramLists)"
      } )
    } )


    it ( 'should create a one dependency correctly', async () => {
      expect ( comparableDi ( paramDi ) ).toEqual ( {
        "dependsOn": {
          "clean": "function",
          "deps": [ "paramsList" ]
        },
        "name": "params",
        "optional": "I.focus?(params)"
      } )
    } )
    it ( 'should create a second one dependency correctly', async () => {
      expect ( comparableDi ( taskListDi ) ).toEqual ( {
        "dependsOn": {
          "clean": "nuke",
          "deps": [ "params" ],
          "load": "function"
        },
        "name": "taskList",
        "optional": "I.focus?(taskList)"
      } )
    } )
    it ( 'should create a two dependencies correctly', async () => {
      expect ( comparableDi ( serviceListDi ) ).toEqual ( {
        "name": "serviceList",
        "dependsOn": {
          "clean": "nuke",
          "deps": [ "params", "task"
          ],
          "load": "function"
        },
        "optional": "I.focus?(serviceList)"
      } )
    } )
    it ( 'should create a three dependencies correctly', async () => {
      expect ( comparableDi ( serviceDi ) ).toEqual ( {
        "name": "service",
        "dependsOn": {
          "clean": "leave",
          "deps": [ "params", "task", "serviceList" ]
        },
        "optional": "I.focus?(service)"
      } )
    } )
  } )
  describe ( 'load', () => {
    it ( "should load for a zero deps", async () => {
      expect ( await loadFn ( paramsListDefDi.dependsOn, [] ) () ).toEqual ( someParamsDef )
    } )
    it ( 'should load for a one deps', async () => {
      expect ( await loadFn ( taskListDi.dependsOn, [ someParams ] ) () ).toEqual ( [
        "Task:geo,product,channel",
        "Task:uk,cc,web"
      ] )
    } )
    it ( 'should load for a two deps', async () => {
      expect ( await loadFn ( serviceListDi.dependsOn, [ someParams, 'aTask' ] ) () ).toEqual ( [
        "Service:aTask:geo,product,channel",
        "Service:aTask:uk,cc,web"
      ] )
    } )
  } )
} )
describe ( 'cleanValue', () => {
  it ( "should give a clean value - one dep fn", () => {
    expect ( cleanValue ( paramDi, {}, [ someParamsDef ] ) ).toEqual ( { "ch": "web", "geo": "uk", "product": "carLoan" } )
  } )

  it ( "should give a clean value - nuke", () => {
    expect ( cleanValue ( taskListDi, { params: someParams, taskList: [ 'a', 'b' ] }, [] ) ).toEqual ( undefined )
  } )
  it ( "should give a clean value - leave", () => {
    expect ( cleanValue ( serviceDi, { params: someParams, taskList: [ 'a', 'b' ], serviceList: [ 's1' ], service: undefined }, [] ) ).toEqual ( undefined )
    expect ( cleanValue ( serviceDi, { params: someParams, taskList: [ 'a', 'b' ], serviceList: [ 's1' ], service: 'someService' }, [] ) ).toEqual ( 'someService' )
  } )
} )


