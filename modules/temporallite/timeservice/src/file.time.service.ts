import { promises as fs } from 'fs';
import path from 'path';

export interface TimeserviceData {
  filenameForTest: string;
  timeBetweenChecksms: number;
  offsetFromNow: number;
  maximumAllowedOffset: number; //Checked at the start of the service and will throw error. After that... just logs
  maximumAllowedDrift: number; //between calls. If the offset between calls is greater than this, an error is logged
  errorCount?: number;
  log: ( message: string, error: boolean ) => void;
  allowMaxOffsetError?: boolean;
}
export function defaultTimeServiceData ( filenameForTest: string, log: ( message: string, error: boolean ) => void ): TimeserviceData {
  return {
    filenameForTest,
    timeBetweenChecksms: 1000,
    offsetFromNow: 0,
    maximumAllowedOffset: 20000,
    maximumAllowedDrift: 100,
    errorCount: 0,
    log
  }
}


export type CheckTimeSynchronization = ( config: TimeserviceData, ) => Promise<number>;
export const checkTimeSynchronization=  ( delayCodeForTest?: () => Promise<void> ): CheckTimeSynchronization => async config => {
  const testFilePath = config.filenameForTest;
  try {
    // Ensure the directory for the test file exists
    const dir = path.dirname ( testFilePath );
    await fs.mkdir ( dir, { recursive: true } );


    // Touch the file to update its mtime
    await fs.writeFile ( testFilePath, '', { flag: 'w' } );

    // Get the file stats
    const stats = await fs.stat ( testFilePath );
    const fileTime = stats.mtime.getTime ();
    if ( delayCodeForTest ) await delayCodeForTest ();
    const now = Date.now ();
    const timeDiff = now - fileTime;

    return timeDiff;
  } catch ( error ) {
    config.log ( 'Failed to check time synchronization\n' + error, true );
    config.errorCount++
    console.error ( 'Failed to check time synchronization', error );
    throw error;
  }
};

export type CheckAndHandleOffset =  ( timeServiceData: TimeserviceData ) => Promise<void>;
export const checkAndHandleOffset = (checkTimeSynchronization: CheckTimeSynchronization): CheckAndHandleOffset => async timeServiceData => {
  const currentOffset = await checkTimeSynchronization ( timeServiceData );
  timeServiceData.log ( `Current time offset: ${currentOffset}`, false );
  // Check if the change in offset exceeds the maximum allowed
  if ( Math.abs ( currentOffset - timeServiceData.offsetFromNow ) > timeServiceData.maximumAllowedDrift ) {
    timeServiceData.errorCount++
    timeServiceData.log ( `Error: Time offset change exceeded maximum allowed limit.
Remote: ${currentOffset}\nLocal: ${timeServiceData.offsetFromNow}
Difference is ${Math.abs ( currentOffset - timeServiceData.offsetFromNow )}
Max allowed: ${timeServiceData.maximumAllowedDrift}`, true );
  }
  if ( Math.abs ( currentOffset ) > timeServiceData.maximumAllowedOffset ) {
    timeServiceData.errorCount++
    timeServiceData.log ( `Error: Time offset exceeded maximum allowed limit. 
Remote: ${currentOffset}\nLocal: ${timeServiceData.offsetFromNow} 
Difference is ${Math.abs ( currentOffset - timeServiceData.offsetFromNow )} 
Max allowed: ${timeServiceData.maximumAllowedOffset}`, true );
  }
  timeServiceData.offsetFromNow = currentOffset;
};


async function start ( timeServiceData: TimeserviceData, checkTimeSynchronization: CheckTimeSynchronization, checkAndHandleOffset: CheckAndHandleOffset ): Promise<void> {
  timeServiceData.log ( 'Starting time service', false );
  const firstOffset = await checkTimeSynchronization ( timeServiceData );
  if ( Math.abs ( firstOffset ) > timeServiceData.maximumAllowedOffset ) {
    const msg = `Error: Time offset exceeded maximum allowed limit.
Remote: ${firstOffset}
Local: ${timeServiceData.offsetFromNow}
Difference is ${Math.abs ( firstOffset - timeServiceData.offsetFromNow )}
Max allowed: ${timeServiceData.maximumAllowedOffset}`
    timeServiceData.log ( msg, true )
    if ( timeServiceData.allowMaxOffsetError !== true )
      throw new Error ( ' Time service is not started. Please abort and fix!\n' + msg );
  }
  timeServiceData.offsetFromNow = firstOffset;
  setInterval ( async () => {
    try {
      await checkAndHandleOffset ( timeServiceData );
    } catch ( error ) {
      timeServiceData.log ( 'Failed during time synchronization check:\n' + error, true );
      console.error ( 'Failed during time synchronization check:', error );
    }
  }, timeServiceData.timeBetweenChecksms );
}
