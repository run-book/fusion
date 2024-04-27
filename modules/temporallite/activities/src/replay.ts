import { K0, K1, K2, K3, K4, K5 } from "./kleisli";
import { useWorkspaceHookState } from "./async.hooks";
import { isFailedReplayItem, isSuccessfulReplayItem } from "./replay.state";


export function withReplay<T> ( fn: K0<T>, activityId: string ): K0<T>
export function withReplay<P1, T> ( fn: K1<P1, T>, activityId: string ): K1<P1, T>
export function withReplay<P1, P2, T> ( fn: K2<P1, P2, T>, activityId: string ): K2<P1, P2, T>
export function withReplay<P1, P2, P3, T> ( fn: K3<P1, P2, P3, T>, activityId: string ): K3<P1, P2, P3, T>
export function withReplay<P1, P2, P3, P4, T> ( fn: K4<P1, P2, P3, P4, T>, activityId: string ): K4<P1, P2, P3, P4, T>
export function withReplay<P1, P2, P3, P4, P5, T> ( fn: K5<P1, P2, P3, P4, P5, T>, activityId: string ): K5<P1, P2, P3, P4, P5, T>
export function withReplay<T, Args extends any[]> (
  fn: ( activityId: string, ...args: Args ) => Promise<T>,
  activityId: string ): ( ...args: Args ) => Promise<T> {
  return async ( ...args: Args ): Promise<T> => {
    let state = useWorkspaceHookState ()
    const { currentReplayIndex, replayState, updateCache, updateCacheWithError, incMetric } = state
    // Retrieve the current replay item if it exists
    const replayItem = replayState[ currentReplayIndex ];

    // Move to the next index
    state.currentReplayIndex++;
    // Check if we can use a cached result
    if ( replayItem && replayItem.id === activityId ) {
      if ( isSuccessfulReplayItem<T> ( replayItem ) ) {
        incMetric ( 'activity.replay.success' )
        return replayItem.success;
      }  // Return the successful result from cache
      if ( isFailedReplayItem ( replayItem ) ) {
        incMetric ( 'activity.replay.success' )
        throw enhanceErrorWithOriginalProperties ( replayItem.failure );
      } else {
        incMetric ( 'activity.replay.invalid' )
        throw new Error ( `Invalid replay item: ${JSON.stringify ( replayItem )}` );
      }  // Rethrow the cached failure
    }

    // Execute the function and update the cache if no valid cache item was found
    try {
      const result = await fn ( activityId, ...args );
      updateCache ( activityId, result );
      return result;
    } catch ( error ) {
      updateCacheWithError ( activityId, error );
      throw error;
    }
  };
}

function enhanceErrorWithOriginalProperties ( originalError: any ) {
  const newError = new Error ( originalError.message );
  newError.name = originalError.name;

  // Copy all enumerable properties from the original error to the new error
  Object.keys ( originalError ).forEach ( key => {
    newError[ key ] = originalError[ key ];
  } );

  return newError;
}