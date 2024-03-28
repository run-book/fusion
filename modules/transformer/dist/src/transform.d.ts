import { NameAnd } from "@laoban/utils";
import { FileOps } from "@laoban/fileops";
import { YamlCapability } from "@itsmworkbench/yaml";
export interface LegalParameter {
    legal: string[];
}
export declare function isLegalParameter(x: any): x is LegalParameter;
export type Parameter = LegalParameter | {};
export interface ConfigFile {
    version: 1;
    parameters: NameAnd<Parameter>;
    hierarchy: NameAnd<string>;
    values: NameAnd<any>;
}
type LoadContext = {
    fileOps: FileOps;
    yaml: YamlCapability;
    dic: any;
};
export type FileDetails = {
    trail: string[];
    file: string;
    exists: boolean;
    errors: string[];
    yaml: any | undefined;
};
export declare function validateHierarchy(hierarchy: NameAnd<string>): string[];
export declare function validateParameters(dic: any, properties: NameAnd<Parameter>): string[];
export declare function recursivelyFindFileNames(context: LoadContext, root: string, trail: string[], file: string, debug: boolean): Promise<FileDetails[]>;
export {};
