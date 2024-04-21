import { InputOutputSampleNS } from "@fusionconfig/sample";
import { NamedUrl, UrlQuery } from "@itsmworkbench/urlstore";

export const schemaToTestQuery = ( schema: NamedUrl, namespace: InputOutputSampleNS ) => {
  const query: UrlQuery = {
    org: schema.organisation,
    namespace,
    pageQuery: { page: 1, pageSize: 100 },
    order: 'name',
    path: schema.name
  }
  return query;
};

export const schemaNameToTestName = ( namespace: InputOutputSampleNS ) => ( schemaName: NamedUrl, test: string ): NamedUrl => {
  return  { scheme: 'itsm', organisation: schemaName.organisation,  namespace, name: schemaName.name + '/' + test }
};