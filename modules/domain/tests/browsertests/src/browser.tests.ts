import { RunTests } from "@fusionconfig/tests";


export function browserTestsRun ( baseUri: string ): RunTests {
  fetch ( baseUri + '/tests', {
    method: 'POST',
    body: JSON.stringify ( {
      schema: {
        input: { name: 'browserTestsRun', schema: {} },
        output: { name: 'browserTestsRun', schema: {} }
      },
      transformer: { name: 'browserTestsRun', transformerDesc: 'browserTestsRun' },
      tests: []
    } )
  } )


  return async ( defn ) => {
    return {
      transformer: { name: 'browserTestsRun', transformerDesc: 'browserTestsRun' },
      inputSchema: { name: 'browserTestsRun', schema: {} },
      outputSchema: { name: 'browserTestsRun', schema: {} },
      tests: []
    }
  }
}