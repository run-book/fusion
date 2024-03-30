import { addTaskSchemasToServices, defaultKafkaNameFn, postProcess, PostProcessor } from "./post.process";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { intoMerged } from "./merge";
import { hasErrors } from "@laoban/utils";
import { convertToYaml, defaultCommentFunction } from "./convert.to.yaml";
import { NamedLoadResult, UrlLoadNamedFn, writeUrl } from "@itsmworkbench/urlstore";

const yamlAsText = `
version: 1

kafka_schemas: "service.<service>.<reqOrResp>"

task_schemas: 
  - "task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel}"

services:
  experian_aml:
    description: "AML service provided by Experian for real-time background checks."
    request:
      topic: "experian.aml.request"
    response:
      topic: "experian.aml.response"

  equifax_creditCheck:
    description: "Credit score checking service provided by Equifax."
    request:
      topic: "equifax.creditScore.request"
    response:
      topic: "equifax.creditScore.response"

  experian_creditCheck:
    description: "Credit score checking service provided by Experian."
    request:
      topic: "experian.creditScore.request"
    response:
      topic: "experian.creditScore.response"
`

const yamlCapability = jsYaml ()
const obj = yamlCapability.parser ( yamlAsText )
const fakeLoadNamed: UrlLoadNamedFn = async ( url ) => {
  const result: NamedLoadResult<any> = {
    url: writeUrl ( url ),
    mimeType: 'application/json',
    id: 'id for ' + url.name,
    result: 'something',
    fileSize: 100
  }
  return result;
}
describe ( 'post.process', () => {
  it ( 'should return input if no post processors', async () => {
    const merged = intoMerged ( 'pretend.yaml' ) ( obj )
    const originalYaml = convertToYaml ( intoMerged ( 'pretend.yaml' ) ( obj ), defaultCommentFunction )
    const result = await postProcess ( [], merged, {} )
    if ( hasErrors ( result ) ) throw new Error ( 'should not have errors\n' + JSON.stringify ( result, null, 2 ) )
    expect ( convertToYaml ( result, defaultCommentFunction ) ).toEqual ( originalYaml )

  } );
  it ( 'should be able to post process a yaml file adding schemas to request and responses', async () => {
    const merged = intoMerged ( 'pretend.yaml' ) ( obj )
    const result = await postProcess ( [ addTaskSchemasToServices ( defaultKafkaNameFn ( fakeLoadNamed ) ) ], merged, {} )
    if ( hasErrors ( result ) ) throw new Error ( 'should not have errors\n' + JSON.stringify ( result, null, 2 ) )
    expect ( convertToYaml ( result, defaultCommentFunction ) ).toEqual ( `version:
  1 # Contributed by: pretend.yaml
kafka_schemas:
  service.<service>.<reqOrResp> # Contributed by: pretend.yaml
task_schemas:
  - task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel} # Contributed by: pretend.yaml
services:
  experian_aml:
    description:
      AML service provided by Experian for real-time background checks. # Contributed by: pretend.yaml
    request:
      topic:
        experian.aml.request # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.experian_aml.request # Contributed by: addRequestsAndResponsesToServices
    response:
      topic:
        experian.aml.response # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.experian_aml.response # Contributed by: addRequestsAndResponsesToServices
  equifax_creditCheck:
    description:
      Credit score checking service provided by Equifax. # Contributed by: pretend.yaml
    request:
      topic:
        equifax.creditScore.request # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.equifax_creditCheck.request # Contributed by: addRequestsAndResponsesToServices
    response:
      topic:
        equifax.creditScore.response # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.equifax_creditCheck.response # Contributed by: addRequestsAndResponsesToServices
  experian_creditCheck:
    description:
      Credit score checking service provided by Experian. # Contributed by: pretend.yaml
    request:
      topic:
        experian.creditScore.request # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.experian_creditCheck.request # Contributed by: addRequestsAndResponsesToServices
    response:
      topic:
        experian.creditScore.response # Contributed by: pretend.yaml
      task_schema:
        somename # Contributed by: addRequestsAndResponsesToServices
      kafka_schema:
        service.experian_creditCheck.response # Contributed by: addRequestsAndResponsesToServices
` )
  } );
} )
