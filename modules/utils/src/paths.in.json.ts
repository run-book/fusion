import { ErrorsAnd } from "@laoban/utils";

export type PathsInJson = {
  [ key: string ]: PathsInJson | string;
};
export function pathListToJson ( paths: string[], errorPrefix: string ): ErrorsAnd<PathsInJson> {
  const root: PathsInJson = {};
  let errors: string[] = [];

  paths.forEach ( path => {
    const segments = path.split ( '/' );
    let current = root;

    for ( let i = 0; i < segments.length; i++ ) {
      const segment = segments[ i ];
      const isLastSegment = i === segments.length - 1;

      if ( isLastSegment ) {
        // If we're at a file and the directory already has a file, it's an error
        if ( typeof current === 'string' || Object.keys ( current ).length > 0 && current[ segment ] === undefined ) {
          errors.push ( errorPrefix + path );
          break;
        }
        current[ segment ] = path; // Use the full path as the value for files
      } else {
        // Directory logic
        if ( typeof current[ segment ] === 'string' ) {
          // If a file exists where we expect a directory, it's an error
          errors.push ( errorPrefix + path );
          break;
        }
        if ( !current[ segment ] ) {
          current[ segment ] = {}; // Initialize the directory
        }
        current = current[ segment ] as PathsInJson;
      }
    }
  } );

  return errors.length > 0 ? errors : root;
}
export type ValidatePathFn = ( path: string ) => Promise<string[]>;
export async function validatePathsInJson ( paths: PathsInJson, validate: ValidatePathFn ): Promise<string[]> {

  // Helper function to recursively validate paths
  async function validateRecursively ( node: PathsInJson | string, pathAccumulator: string = '' ): Promise<string[]> {
    if ( typeof node === 'string' ) {
      return validate ( pathAccumulator );
    } else {
      // Aggregate errors from all children
      let errors: string[] = [];
      for ( const [ key, child ] of Object.entries ( node ) ) {
        const newPath = pathAccumulator ? `${pathAccumulator}/${key}` : key;
        const childErrors = await validateRecursively ( child, newPath );
        errors = errors.concat ( childErrors );
      }
      return errors;
    }
  }
  return validateRecursively ( paths );
}


export function getPath ( path: string, pathInJson: PathsInJson ): string | undefined {
  const segments = path.split ( '/' );
  const currentNode = segments.reduce<PathsInJson | string | undefined> (
    ( current, segment ) =>
      typeof current === 'string' || current === undefined ? undefined : current[ segment ], pathInJson );
  return typeof currentNode === 'string' ? currentNode : undefined;
}

export const findFirstPath = ( paths: string[], pathInJson: PathsInJson ): string | undefined =>
  paths.find ( path => getPath ( path, pathInJson ) );