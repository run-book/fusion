import { RunTests } from "@fusionconfig/tests";


export function browserTestsRun ( baseUri: string ): RunTests {
  return async ( defn ) => {
    const response = await fetch ( baseUri + '/tests', {
      method: 'POST',
      body: JSON.stringify ( defn ),
      headers: { 'Content-Type': 'application/json' }
    } )
    return await response.json ();
  }
}
