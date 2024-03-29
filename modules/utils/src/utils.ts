const placeHolderPattern = /\$\{([^}]+)\}/g;

export function extractPlaceholders ( text: string ): string[] {
  const matches = [ ...text.matchAll ( placeHolderPattern ) ];
  return matches.map ( match => match[ 1 ] ); // match[1] contains the captured group
}
