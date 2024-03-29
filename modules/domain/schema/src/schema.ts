import { NameSpaceDetails, NameSpaceDetailsForGit, nameSpaceDetailsForGit } from "@itsmworkbench/urlstore";


export const schemaNs: NameSpaceDetailsForGit =
               nameSpaceDetailsForGit ( 'schema', {
                 parser: async ( id: string, s: string ) =>JSON.parse(s),
                 writer: ( s: string ) => s + "_written",
                 mimeType: 'application/json',
                 extension: 'json',
               } )