import { fileOpsNode } from "@laoban/filesops-node";
import { findFileUp } from "@laoban/fileops";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { defaultCommentFactoryFunction, loadAndMergeAndYamlParts, LoadFilesFn } from "@fusionconfig/config";
import { findConfigUsingFileops } from "./load.files";

const fileOps = fileOpsNode ()
const laobanDirPromise = findFileUp ( process.cwd (), async s => fileOps.isFile ( fileOps.join ( s, 'laoban.json' ) ) )
const testDirPromise = laobanDirPromise.then ( d => d ? fileOps.join ( d, 'demo' ) : undefined )
let params = { channel: 'merchantPortal', geo: 'uk', product: 'carLoan' };

const loadFiles: LoadFilesFn = findConfigUsingFileops ( fileOps, jsYaml () )
const defaultCommentFunction = defaultCommentFactoryFunction ( 85 )
describe ( "merging global.yaml", () => {
  it ( "should have a mergeForCli", async () => {
    const { fileDetails, sorted, errors, yaml } =
            await loadAndMergeAndYamlParts ( loadFiles, [], defaultCommentFunction,params, await testDirPromise, 'global.yaml', false )
    expect ( errors ).toEqual ( [] )
    expect ( yaml ).toEqual ( `# {"channel":"merchantPortal","geo":"uk","product":"carLoan"}
#
# Files
# {"trail":[],"file":"global.yaml","exists":true,"errors":[]}
# {"trail":["global.yaml"],"file":"product/carLoan/carLoan.yaml","exists":true,"errors":[]}
# {"trail":["global.yaml"],"file":"services/services.yaml","exists":true,"errors":[]}
#
# Files not found
# {"trail":["global.yaml"],"file":"geo/uk/carLoan/merchantPortal/uk_carLoan_merchantPortal.yaml","exists":false,"errors":[]}
# {"trail":["global.yaml"],"file":"geo/uk/carLoan/uk_carLoan.yaml","exists":false,"errors":[]}
# {"trail":["global.yaml"],"file":"geo/uk_overrides.yaml","exists":false,"errors":[]}
#
version:
  1 # Contributed by: global.yaml, services/services.yaml
parameters:
  product:
    legal:
      - instantLoan # Contributed by: global.yaml
      - mortgage # Contributed by: global.yaml
      - creditCard # Contributed by: global.yaml
      - carLoan # Contributed by: global.yaml
  geo:
    legal:
      - uk # Contributed by: global.yaml
      - sw # Contributed by: global.yaml
      - ca # Contributed by: global.yaml
  channel:
    legal:
      - customerPortal # Contributed by: global.yaml
      - merchantPortal # Contributed by: global.yaml
      - selfServicePortal # Contributed by: global.yaml
hierarchy:
  Channel Specific Configuration:
    geo/uk/carLoan/merchantPortal/uk_carLoan_merchantPortal.yaml # Contributed by: global.yaml
  This Product in This Country:
    geo/uk/carLoan/uk_carLoan.yaml # Contributed by: global.yaml
  Geo Specific Configuration:
    geo/uk_overrides.yaml # Contributed by: global.yaml
  Product Specific Configuration:
    product/carLoan/carLoan.yaml # Contributed by: global.yaml
  Service integration details - topics and schemas:
    services/services.yaml # Contributed by: global.yaml
capabilities:
  aml:
    service:
      services.equifax_creditCheck # Contributed by: global.yaml
  creditCheck:
    service:
      services.experian_creditCheck # Contributed by: global.yaml
  signatureVerification:
    service:
      services.internal_signatureVerification # Contributed by: global.yaml
  pricing:
    service:
      services.internal_pricingService # Contributed by: global.yaml
  limitManagement:
    service:"services.internal_limitManagement" # Contributed by: global.yaml
kafka_schemas:
  service.<service>.<reqOrResp> # Contributed by: global.yaml
services:
  experian_aml:
    description:
      AML service provided by Experian for real-time background checks. # Contributed by: services/services.yaml
    request:
      topic:
        experian.aml.request # Contributed by: services/services.yaml
    response:
      topic:
        experian.aml.response # Contributed by: services/services.yaml
  equifax_creditCheck:
    description:
      Credit score checking service provided by Equifax. # Contributed by: services/services.yaml
    request:
      topic:
        equifax.creditScore.request # Contributed by: services/services.yaml
    response:
      topic:
        equifax.creditScore.response # Contributed by: services/services.yaml
  experian_creditCheck:
    description:
      Credit score checking service provided by Experian. # Contributed by: services/services.yaml
    request:
      topic:
        experian.creditScore.request # Contributed by: services/services.yaml
    response:
      topic:
        experian.creditScore.response # Contributed by: services/services.yaml
  internal_signatureVerification:
    description:
      Internal signature verification service for document signing. # Contributed by: services/services.yaml
    request:
      topic:
        internal.signatureVerification.request # Contributed by: services/services.yaml
    response:
      topic:
        internal.signatureVerification.response # Contributed by: services/services.yaml
  internal_pricingService:
    description:
      Internal pricing service for product and service pricing adjustments. # Contributed by: services/services.yaml
    request:
      topic:
        internal.pricing.request # Contributed by: services/services.yaml
    response:
      topic:
        internal.pricing.response # Contributed by: services/services.yaml
  internal_carloan_PricingService:
    description:
      Internal pricing service for carloans # Contributed by: services/services.yaml
    request:
      topic:
        internal.pricing.request # Contributed by: services/services.yaml
    response:
      topic:
        internal.pricing.response # Contributed by: services/services.yaml
  internal_limitManagement:
    description:
      Limit management service for transaction and account limits. # Contributed by: services/services.yaml
    request:
      topic:
        internal.limitManagement.request # Contributed by: services/services.yaml
    response:
      topic:
        internal.limitManagement.response # Contributed by: services/services.yaml
task_schemas:
  - task.<task>.<reqOrResp>.uk.carLoan.merchantPortal # Contributed by: global.yaml
  - task.<task>.<reqOrResp> # Contributed by: global.yaml
  - task.<task>.<reqOrResp>.uk.carLoan # Contributed by: global.yaml
  - task.<task>.<reqOrResp>.carLoan # Contributed by: global.yaml
transformations:
  - fromSchema:
      http://schemas.mycompany.com/carLoanForAml.schema.json # Contributed by: product/carLoan/carLoan.yaml
    toSchema:
      https://schemas.mycompany.com/experian/creditScore/request/v2/creditScoreRequest.avsc # Contributed by: product/carLoan/carLoan.yaml
    transformation:
      transformations/request_carloan_experian_aml/request_carloan_experian_aml.jsonata # Contributed by: product/carLoan/carLoan.yaml
  - fromSchema:
      http://schemas.mycompany.com/carLoanForAml.schema.json # Contributed by: product/carLoan/carLoan.yaml
    toSchema:
      https://schemas.mycompany.com/internal/pricing/request/v3/carloanspricingRequest.avsc # Contributed by: product/carLoan/carLoan.yaml
    transformation:
      transformations/request_internal_carloan_PricingService/request_internal_carloan_PricingService.jsonata # Contributed by: product/carLoan/carLoan.yaml

` )

  } )
} )