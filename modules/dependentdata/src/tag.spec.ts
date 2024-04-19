import { diTagChanged } from './tag';

describe ( 'diTagChanged', () => {
  test ( 'should return false for equal strings', () => {
    expect ( diTagChanged ( 'test', 'test' ) ).toBe ( false );
  } );

  test ( 'should return true for different strings', () => {
    expect ( diTagChanged ( 'test1', 'test2' ) ).toBe ( true );
  } );

  test ( 'should return false for two equal string arrays', () => {
    expect ( diTagChanged ( [ 'a', 'b' ], [ 'a', 'b' ] ) ).toBe ( false );
  } );

  test ( 'should return true for different string arrays', () => {
    expect ( diTagChanged ( [ 'a', 'b' ], [ 'a', 'c' ] ) ).toBe ( true );
  } );

  test ( 'should return true for string arrays of different lengths', () => {
    expect ( diTagChanged ( [ 'a', 'b' ], [ 'a', 'b', 'c' ] ) ).toBe ( true );
  } );

  test ( 'should return true for a string and a string array', () => {
    expect ( diTagChanged ( 'a', [ 'a' ] ) ).toBe ( true );
  } );

  test ( 'should return true for a string array and a string', () => {
    expect ( diTagChanged ( [ 'a' ], 'a' ) ).toBe ( true );
  } );

  test ( 'should return false for an empty string and an empty string array', () => {
    expect ( diTagChanged ( '', [] ) ).toBe ( true );
  } );

  test ( 'should return false for two empty string arrays', () => {
    expect ( diTagChanged ( [], [] ) ).toBe ( false );
  } );

  test ( 'should return true for non-matching elements in string arrays', () => {
    expect ( diTagChanged ( [ 'a', 'b', 'c' ], [ 'a', 'c', 'b' ] ) ).toBe ( true );
  } );
} );
