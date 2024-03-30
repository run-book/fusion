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

export function removeLastExtension(path: string): string {
  // Split the path by dots to separate extensions
  const parts = path.split('.');

  // If there's only one part, it means there's no extension to remove
  if (parts.length === 1) {
    return path;
  }

  // Remove the last part (extension)
  parts.pop();

  // Rejoin the remaining parts
  return parts.join('.');
}
