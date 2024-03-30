import { NameSpaceDetailsForGit, nameSpaceDetailsForGit } from "@itsmworkbench/urlstore";


export const transformNs: NameSpaceDetailsForGit =
               nameSpaceDetailsForGit ( 'transformer', {
                 parser: async ( id: string, s: string ) => {},
                 writer: ( s: string ) => s + "_written",
                 extension: 'jsonata',
               } )