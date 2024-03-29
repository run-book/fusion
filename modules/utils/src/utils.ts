const placeHolderPattern = /\$\{([^}]+)\}/g;

export function extractPlaceholders ( text: string ): string[] {
  const matches = [ ...text.matchAll ( placeHolderPattern ) ];
  return matches.map ( match => match[ 1 ] ); // match[1] contains the captured group
}
export function parseParams ( params: string | boolean ) {
  if ( typeof params === 'string' ) {
    const pairs = params.split ( ',' )
    return pairs.reduce ( ( acc, pair ) => {
      const [ key, value ] = pair.split ( '=' )
      acc[ key ] = value
      return acc
    }, {} )
  }
  return {}
}