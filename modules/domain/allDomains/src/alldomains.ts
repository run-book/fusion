import { NameSpaceDetailsForGit, OrganisationUrlStoreConfigForGit } from "@itsmworkbench/urlstore"
import { NameAnd } from "@laoban/utils"
import { schemaNs } from "@fusionconfig/schema";
import { transformNs } from "@fusionconfig/transformer";

export function allDomainDetails (): NameAnd<NameSpaceDetailsForGit> {
  return {
    schema: schemaNs,
    transformer: transformNs
  }
}
export function defaultOrgConfig (): OrganisationUrlStoreConfigForGit {
  return {
    baseDir: 'organisations',
    nameSpaceDetails: allDomainDetails ()
  }
}

