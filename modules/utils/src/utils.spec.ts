import { extractPlaceholders, parseParams, permutate, simpleTemplate } from "./utils";

describe ( 'extractPlaceholders', () => {
  it ( 'extracts single placeholder correctly', () => {
    const text = 'Hello, ${name}!';
    const expected = [ 'name' ];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  it ( 'extracts multiple placeholders correctly', () => {
    const text = '${greeting}, ${name}! Welcome to ${location}.';
    const expected = [ 'greeting', 'name', 'location' ];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  it ( 'returns an empty array when there are no placeholders', () => {
    const text = 'Hello, world!';
    const expected: string[] = [];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  it ( 'handles strings with special characters', () => {
    const text = '${greeting}, ${name}! Your balance is ${balance}$.';
    const expected = [ 'greeting', 'name', 'balance' ];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  it ( 'returns an empty array for an empty string', () => {
    const text = '';
    const expected: string[] = [];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  it ( 'does not recognize false placeholders', () => {
    const text = 'Hello, $name} and ${location!';
    const expected: string[] = [];
    expect ( extractPlaceholders ( text ) ).toEqual ( expected );
  } );

  // You can add more tests here to cover any other cases you can think of.
} );


describe ( 'parseParams', () => {
  it ( 'parses string with multiple parameters correctly', () => {
    const params = 'key1=value1,key2=value2,key3=value3';
    const expected = { key1: 'value1', key2: 'value2', key3: 'value3' };
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  it ( 'parses string with a single parameter correctly', () => {
    const params = 'key=value';
    const expected = { key: 'value' };
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  it ( 'returns an empty object for empty string input', () => {
    const params = '';
    const expected = {};
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  it ( 'returns an empty object for boolean true input', () => {
    const params = true;
    const expected = {};
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  it ( 'returns an empty object for boolean false input', () => {
    const params = false;
    const expected = {};
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  it ( 'handles string without equal sign', () => {
    const params = 'key1,key2=value2';
    // Assuming the function assigns undefined for keys without values.
    const expected = { key1: undefined, key2: 'value2' };
    expect ( parseParams ( params ) ).toEqual ( expected );
  } );

  // Add more tests here for any other edge cases you can think of.
} );


describe('permutate function', () => {
  it('should process all parameter permutations', async () => {
    const params = {
      product: {
        legal: ['instantLoan', 'mortgage']
      },
      geo: {
        legal: ['uk', 'us']
      }
    };

    const processedParams: any[] = [];

    // Mock processOne function that accumulates parameters into an array
    const mockProcessOne = async (params: { [name: string]: string }) => {
      processedParams.push(params);
    };

    await permutate(params, mockProcessOne);

    // Expected permutations
    const expectedPermutations = [
      { product: 'instantLoan', geo: 'uk' },
      { product: 'instantLoan', geo: 'us' },
      { product: 'mortgage', geo: 'uk' },
      { product: 'mortgage', geo: 'us' }
    ];

    // Check if all expected permutations were processed
    expect(processedParams).toEqual(expect.arrayContaining(expectedPermutations));
    // Additionally, check if the number of processed permutations matches the expected number
    expect(processedParams.length).toBe(expectedPermutations.length);
  });
});