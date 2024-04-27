import {} from "./replay.state";
import { workspaceHookState } from "./async.hooks";
import { withReplay } from "./replay";
import { IncMetric, inMemoryIncMetric } from "./metrics";
import { NameAnd } from "@laoban/utils";


describe ( 'replay', () => {
  const activityId = 'testActivity';
  let replayState;
  let updateState; // Separate state for updates
  let metrics: NameAnd<number> = {}
  const incMetric = inMemoryIncMetric ( metrics );
  const empty = { workflowId: 'someId', workflowInstanceId: 'anotherId', currentReplayIndex: 0, incMetric }
  beforeEach ( () => {
    replayState = []; // Replay state is now an array of ReplayItems
    updateState = {
      successes: {},
      failures: {}
    };
    for ( const key in metrics ) delete metrics[ key ]
  } );

  const updateCache = ( activityId, result ) => {
    if ( !updateState.successes[ activityId ] ) {
      updateState.successes[ activityId ] = [];
    }
    updateState.successes[ activityId ].push ( result );
  };

  const updateCacheWithError = async ( activityId, error ) => {
    if ( !updateState.failures[ activityId ] ) {
      updateState.failures[ activityId ] = [];
    }
    updateState.failures[ activityId ].push ( error );
  };

  it ( 'should return a cached success result without executing the function', async () => {
    const fn = jest.fn ( () => Promise.resolve ( 'new data' ) );
    replayState.push ( { id: activityId, success: 'cached data' } ); // Add a successful replay item

    const replayFunction = withReplay<string> ( fn, activityId );
    const result = await workspaceHookState.run ( { ...empty, replayState, updateCache, updateCacheWithError },
      async () => await replayFunction () );

    expect ( result ).toBe ( 'cached data' );
    expect ( fn ).not.toHaveBeenCalled ();
    expect ( updateState.successes[ activityId ] ).toBeUndefined ();
    expect ( updateState.failures[ activityId ] ).toBeUndefined ();
    expect ( metrics ).toEqual ( { 'activity.replay.success': 1 } )
  } );

  it ( 'should execute the function and update the update cache if no cached result is available', async () => {
    const fn = jest.fn ( () => Promise.resolve ( 'new data' ) );
    // No previous executions or cached results

    const replayFunction = withReplay ( fn, activityId );
    const result = await workspaceHookState.run ( { ...empty, replayState, updateCache, updateCacheWithError }, async () => await replayFunction () );

    expect ( result ).toBe ( 'new data' );
    expect ( fn ).toHaveBeenCalledTimes ( 1 );
    expect ( updateState.successes[ activityId ] ).toEqual ( [ 'new data' ] );
    expect ( updateState.failures[ activityId ] ).toBeUndefined ();
    expect ( metrics ).toEqual ( {} )
  } );

  it ( 'should throw a recorded error if the previous execution resulted in an error', async () => {
    const fn = jest.fn ( () => Promise.resolve ( 'new data' ) );
    replayState.push ( { id: activityId, failure: new Error ( 'Error during execution' ) } ); // Add a failed replay item

    const replayFunction = await withReplay ( fn, activityId );

    const result = workspaceHookState.run ( { ...empty, replayState, updateCache, updateCacheWithError }, async () => await replayFunction () );
    // Expect the function to throw the recorded error
    await expect ( result ).rejects.toThrow ( 'Error during execution' );
    expect ( fn ).not.toHaveBeenCalled ();
    expect ( updateState.successes[ activityId ] ).toBeUndefined ();
    expect ( updateState.failures[ activityId ] ).toBeUndefined ();
    expect ( metrics ).toEqual ( { 'activity.replay.success': 1 } )
  } );
} );
