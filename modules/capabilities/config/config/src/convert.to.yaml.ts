import { Merged } from "./merge";
import { NameAnd } from "@laoban/utils";

export type CommentFunction = ( files: string[] ) => string | undefined;

export const defaultCommentFunction: CommentFunction = ( files ) => {
  if ( files === undefined || files.length === 0 ) return undefined;
  return `# Contributed by: ${files.join ( ', ' )}`;
};

export function convertPrimitiveToYaml ( value: string | number | boolean, files: string[], commentFunc: CommentFunction, depth: number ): string {
  const indent = '  '.repeat ( depth );
  const comment = commentFunc ( files );
  return `${indent}${value}${comment ? ` ${comment}` : ''}\n`;
}

export function convertArrayToYaml ( array: Merged[], commentFunc: CommentFunction, depth: number ): string {
  const indent = '  '.repeat ( depth );
  let yamlStr = '';
  array.forEach ( ( item ) => {
    const itemYaml = convertToYaml ( item, commentFunc, depth + 1 );
    yamlStr += `${indent}- ${itemYaml.trim ()}\n`;
  } );
  return yamlStr;
}

export function convertObjectToYaml ( obj: NameAnd<Merged>, commentFunc: CommentFunction, depth: number ): string {
  let yamlStr = '';
  try {
    Object.entries ( obj ).forEach ( ( [ key, value ] ) => {
      const indent = '  '.repeat ( depth );
      try {
        if ( value !== undefined )
          yamlStr += `${indent}${key}:\n${convertToYaml ( value, commentFunc, depth + 1 )}`;
      } catch ( e ) {
        console.log ( 'Error in convertObjectToYaml for ', key, value )
        throw e
      }
    } );
    return yamlStr;
  } catch ( e ) {
    console.log ( 'Error in convertObjectToYaml', obj, commentFunc, depth )
    throw e
  }
}

export function convertToYaml ( merged: Merged, commentFunc: CommentFunction, depth: number = 0 ): string {
  const indent = '  '.repeat ( depth );
  const comment = commentFunc ( merged.files );

  // Handle primitive types directly
  if ( typeof merged.value !== 'object' ) {
    return convertPrimitiveToYaml ( merged.value, merged.files, commentFunc, depth );
  }

  // Delegate to specific functions based on type
  if ( Array.isArray ( merged.value ) ) {
    return convertArrayToYaml ( merged.value, commentFunc, depth );
  } else {
    return convertObjectToYaml ( merged.value, commentFunc, depth );
  }
}
