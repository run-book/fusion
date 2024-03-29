import { fileOpsNode } from "@laoban/filesops-node";
import { findFileUp } from "@laoban/fileops";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { mergeForCli } from "./configCommands";
import { thereAndBackContext, ThereAndBackContext } from "./context";

import { convertToYaml, defaultCommentFunction } from "@fusionconfig/merger";

const fileOps = fileOpsNode ()
const laobanDirPromise = findFileUp ( process.cwd (), async s => fileOps.isFile ( fileOps.join ( s, 'laoban.json' ) ) )
const testDirPromise = laobanDirPromise.then ( d => d ? fileOps.join ( d, 'demo' ) : undefined )
let params = { channel: 'merchantPortal', geo: 'uk', product: 'carLoan' };
const context: ThereAndBackContext = thereAndBackContext ( 'intellimaintain', 'someVersion', fileOpsNode (), jsYaml () )


describe ( "merging global.yaml", () => {
  it ( "should have a mergeForCli", async () => {
    const { fileDetails, merged, sorted, errors } = await mergeForCli ( context, params, await testDirPromise, 'global.yaml', false )
    expect ( errors ).toEqual ( [] )
    const yaml = convertToYaml ( sorted, defaultCommentFunction )
    expect ( yaml ).toEqual ( `version:
  1 # Contributed by: global.yaml, services/services.yaml
parameters:
  channel:
    legal:
      - customerPortal # Contributed by: global.yaml, services/services.yaml
      - merchantPortal # Contributed by: global.yaml, services/services.yaml
      - selfServicePortal # Contributed by: global.yaml, services/services.yaml
  geo:
    legal:
      - ca # Contributed by: global.yaml, services/services.yaml
      - sw # Contributed by: global.yaml, services/services.yaml
      - uk # Contributed by: global.yaml, services/services.yaml
      - us # Contributed by: services/services.yaml
  product:
    legal:
      - carLoan # Contributed by: global.yaml, services/services.yaml
      - creditCard # Contributed by: global.yaml, services/services.yaml
      - instantLoan # Contributed by: global.yaml, services/services.yaml
      - mortgage # Contributed by: global.yaml, services/services.yaml
      - serviceLegal # Contributed by: services/services.yaml
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
services:
  experian_aml:
    description:
      AML service provided by Experian for real-time background checks. # Contributed by: services/services.yaml
    request:
      topic:
        experian.aml.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/experian/aml/request/v1/amlRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        experian.aml.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/experian/aml/response/v1/amlResponse.avsc # Contributed by: services/services.yaml
  equifax_creditCheck:
    description:
      Credit score checking service provided by Equifax. # Contributed by: services/services.yaml
    request:
      topic:
        equifax.creditScore.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/equifax/creditScore/request/v2/creditScoreRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        equifax.creditScore.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/equifax/creditScore/response/v2/creditScoreResponse.avsc # Contributed by: services/services.yaml
  experian_creditCheck:
    description:
      Credit score checking service provided by Experian. # Contributed by: services/services.yaml
    request:
      topic:
        experian.creditScore.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/experian/creditScore/request/v2/creditScoreRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        experian.creditScore.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/experian/creditScore/response/v2/creditScoreResponse.avsc # Contributed by: services/services.yaml
  internal_signatureVerification:
    description:
      Internal signature verification service for document signing. # Contributed by: services/services.yaml
    request:
      topic:
        internal.signatureVerification.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/signatureVerification/request/v1/signatureVerificationRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        internal.signatureVerification.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/signatureVerification/response/v1/signatureVerificationResponse.avsc # Contributed by: services/services.yaml
  internal_pricingService:
    description:
      Internal pricing service for product and service pricing adjustments. # Contributed by: services/services.yaml
    request:
      topic:
        internal.pricing.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/pricing/request/v3/pricingRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        internal.pricing.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/pricing/response/v3/pricingResponse.avsc # Contributed by: services/services.yaml
  internal_carloan_PricingService:
    description:
      Internal pricing service for carloans # Contributed by: services/services.yaml
    request:
      topic:
        internal.pricing.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/pricing/request/v3/carloanspricingRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        internal.pricing.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/pricing/response/v3/pricingResponse.avsc # Contributed by: services/services.yaml
  internal_limitManagement:
    description:
      Limit management service for transaction and account limits. # Contributed by: services/services.yaml
    request:
      topic:
        internal.limitManagement.request # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/limitManagement/request/v1/limitManagementRequest.avsc # Contributed by: services/services.yaml
    response:
      topic:
        internal.limitManagement.response # Contributed by: services/services.yaml
      schema:
        https://schemas.mycompany.com/internal/limitManagement/response/v1/limitManagementResponse.avsc # Contributed by: services/services.yaml
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