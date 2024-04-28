import { checkAndHandleOffset, checkTimeSynchronization, defaultTimeServiceData } from "./file.time.service";

const filenameForTest = 'target/timeTest.txt';
describe ( 'Time Synchronization Tests', function () {
  it ( 'should have less than 100ms offset without delay', async function () {
    const logData: string[] = [];
    const log = ( message: string, error: boolean ) => logData.push ( `Error${error} ${message}` );
    const config = defaultTimeServiceData ( filenameForTest, log );
    const offset = await checkTimeSynchronization ( () => Promise.resolve () ) ( config, );
    expect ( offset ).toBeLessThan ( 100 );
    expect ( logData ).toEqual ( [] );
  } );

  it ( 'should have an offset between 150ms and 250ms with a 200ms delay', async function () {
    const logData: string[] = [];
    const log = ( message: string, error: boolean ) => logData.push ( `Error${error} ${message}` );
    const config = defaultTimeServiceData ( filenameForTest, log );
    const delayCodeForTest = () => new Promise<void> ( resolve => setTimeout ( resolve, 200 ) );
    const offset = await checkTimeSynchronization ( delayCodeForTest ) ( config );
    expect ( offset ).toBeGreaterThanOrEqual ( 150 );
    expect ( offset ).toBeLessThan ( 250 );
  } );
  it ( 'should log an error and increment error count when delayCodeForTest throws an exception', async () => {
    const logData: string[] = [];

    const log = ( message: string, error: boolean ) => logData.push ( `Error${error} ${message}` );
    const config = defaultTimeServiceData ( filenameForTest, log );
    const delayCodeForTest = () => new Promise<void> ( ( _, reject ) => setTimeout ( () => reject ( new Error ( "Simulated error" ) ), 100 ) );

    await expect ( checkTimeSynchronization ( delayCodeForTest ) ( config ) ).rejects.toThrow ( "Simulated error" );
    expect ( logData ).toContainEqual ( 'Errortrue Failed to check time synchronization\nError: Simulated error' );
    expect ( config.errorCount ).toBe ( 1 );
  } );
} );
describe ( 'checkAndHandleOffset', () => {
  let mockCheckTimeSynchronization;
  let config;
  let logData;

  beforeEach ( () => {
    logData = [];
    mockCheckTimeSynchronization = jest.fn ();
    config = {
      filenameForTest: '/path/to/testfile.txt',
      log: ( message, error ) => logData.push ( `Error${error} ${message}` ),
      maximumAllowedDrift: 50,
      maximumAllowedOffset: 100,
      offsetFromNow: 0,
      errorCount: 0
    };
  } );
  it ( 'should log current time offset without errors under normal conditions', async () => {
    mockCheckTimeSynchronization.mockResolvedValue ( 10 );
    const handleOffset = checkAndHandleOffset ( mockCheckTimeSynchronization );
    await handleOffset ( config );
    expect ( logData ).toContainEqual ( 'Errorfalse Current time offset: 10' );
    expect ( config.errorCount ).toBe ( 0 );
  } );
  it ( 'should log error and increment error count when current offset exceeds maximum allowed drift', async () => {
    mockCheckTimeSynchronization.mockResolvedValue ( 60 );
    const handleOffset = checkAndHandleOffset ( mockCheckTimeSynchronization );
    await handleOffset ( config );
    expect ( logData ).toContainEqual ( 'Errortrue Error: Time offset change exceeded maximum allowed limit.\nRemote: 60\nLocal: 0\nDifference is 60\nMax allowed: 50' );
    expect ( config.errorCount ).toBe ( 1 );
  } );
  it ( 'should log error and increment error count when current offset exceeds maximum allowed offset', async () => {
    mockCheckTimeSynchronization.mockResolvedValue ( 200 );
    const handleOffset = checkAndHandleOffset ( mockCheckTimeSynchronization );
    await handleOffset ( config );
    expect ( logData ).toContainEqual ( 'Errortrue Error: Time offset exceeded maximum allowed limit. \nRemote: 200\nLocal: 0 \nDifference is 200 \nMax allowed: 100' );
    expect ( config.errorCount ).toBe ( 2 );
  } );

  it ( 'should continue to update offset even when errors occur', async () => {
    mockCheckTimeSynchronization.mockResolvedValue ( 150 ); // Triggers an error
    const handleOffset = checkAndHandleOffset ( mockCheckTimeSynchronization );
    await handleOffset ( config );
    expect ( config.offsetFromNow ).toBe ( 150 ); // Should still update despite the error
  } );

  it ( 'should accurately handle time delays introduced in synchronization checks', async () => {
    const delayCodeForTest = () => new Promise ( resolve => setTimeout ( resolve, 200 ) ); // Simulated delay
    mockCheckTimeSynchronization.mockImplementation ( async () => {
      await delayCodeForTest ();
      return 200; // Simulate time drift due to delay
    } );
    const handleOffset = checkAndHandleOffset ( mockCheckTimeSynchronization );
    await handleOffset ( config );
    expect ( logData ).toContainEqual ( 'Errorfalse Current time offset: 200' );
  } );
} );



