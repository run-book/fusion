import { FileDetails, LoadFilesFn } from "./config";
import { NameAnd } from "@laoban/utils";
import { Merged, mergeObjectInto } from "./merge";
import { convertToYaml, defaultCommentFunction } from "./convert.to.yaml";

export type LoadedAndMergedParts = {
  fileDetails: FileDetails[],
  errors: FileDetails[],
  sorted: Merged
}
export type LoadedAndMergedAndYamlParts = {
  fileDetails: FileDetails[],
  errors: FileDetails[],
  sorted: Merged
  yaml: string
}

export async function loadAndMergeParts ( loadFiles: LoadFilesFn, params: NameAnd<string>, parent: string, file: string, debug?: boolean ): Promise<LoadedAndMergedParts> {
  const fileDetails = await loadFiles ( params, parent, file, debug )
  const errors = fileDetails.filter ( f => f.errors.length > 0 )
  const merged: Merged = fileDetails.reduce ( ( acc, fd ) => mergeObjectInto ( acc, fd ), { value: undefined, files: [] } )
  const { version, parameters, hierarchy, ...rest } = merged.value as any
  let sorted: Merged = { value: { version, parameters, hierarchy, ...rest }, files: merged.files };
  return { fileDetails, errors, sorted };
}

const makeComment = ( fileDetails: FileDetails[] ): string =>
  fileDetails.map ( ( { yaml, ...rest } ) => `# ${JSON.stringify ( rest )}` ).join ( '\n' );
export async function loadAndMergeAndYamlParts ( loadFiles: LoadFilesFn, params: NameAnd<string>, parent: string, file: string, debug?: boolean ): Promise<LoadedAndMergedAndYamlParts> {
  const parts = await loadAndMergeParts ( loadFiles, params, parent, file, debug )
  const { fileDetails, errors, sorted } = parts
  const yaml = `# ${JSON.stringify ( params )}
#
# Files
${(makeComment ( fileDetails.filter ( f => f.exists ) ))}
#
# Files not found
${makeComment ( fileDetails.filter ( f => !f.exists ) )}
#
${convertToYaml ( sorted, defaultCommentFunction )}
`
  return { ...parts, yaml }
}