import { NameSpaceDetailsForGit, OrganisationUrlStoreConfigForGit } from "@itsmworkbench/urlstore"
import { NameAnd } from "@laoban/utils"
import { schemaNs } from "@fusionconfig/schema";
import { transformNs } from "@fusionconfig/transformer";
import { YamlCapability } from "@itsmworkbench/yaml";

export function allDomainDetails ( yamlCapability: YamlCapability ): NameAnd<NameSpaceDetailsForGit> {
  return {
    schema: schemaNs,
    transformer: transformNs ( yamlCapability )
  }
}
export function defaultOrgConfig ( yamlCapability: YamlCapability ): OrganisationUrlStoreConfigForGit {
  return {
    baseDir: 'organisations',
    nameSpaceDetails: allDomainDetails ( yamlCapability )
  }
}

