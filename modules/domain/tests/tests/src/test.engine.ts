import { ErrorsAnd, hasErrors, mapErrors, mapErrorsK, mapK } from "@laoban/utils";
import { TestEngine, TransformerFn } from "./test.engine.domain";
import { OneTestResult, RanTestResult, RunTests, RunTestsDefn,  SchemaTestResult, TestInExpectedActualOut, TestInOut, TestResults, TestsResult, TransformerTestResult } from "./test.domain";
import { NamedUrl } from "@itsmworkbench/urlstore";
import { schemaNameToTestName } from "./schema.to.test.mapping";

export type TransformerDescAndTx = { transformerDesc: string, tx: TransformerFn }

export async function makeTransformer ( engine: TestEngine, transformer: NamedUrl ): Promise<ErrorsAnd<TransformerDescAndTx>> {
  return mapErrorsK ( await engine.loadNamed<string> ( transformer ),
    async transformerDesc =>
      mapErrors ( await engine.compileTransfomer ( transformerDesc.result ),
        tx => ({ transformerDesc: transformerDesc.result, tx }) ) )
}

export type SchemasAndTransformer = TransformerDescAndTx & {
  schemaNames: TestInOut<NamedUrl>
  schemas: TestInOut<any>
}
export async function loadSchemasAndTransformer ( engine: TestEngine, schemaNames: TestInOut<NamedUrl>, transformer: NamedUrl ): Promise<ErrorsAnd<SchemasAndTransformer>> {
  return mapErrorsK ( await engine.loadNamed ( schemaNames.input ), async input =>
    mapErrorsK ( await engine.loadNamed ( schemaNames.output ), async output =>
      mapErrors ( await makeTransformer ( engine, transformer ), transformerDescAndTx =>
        ({ schemaNames: schemaNames, schemas: { input: input.result, output: output.result }, ...transformerDescAndTx }) ) ) )
}


export async function loadTestValues ( engine: TestEngine, schema: TestInOut<NamedUrl>, tx: TransformerFn, inpTestName: NamedUrl, outTestName: NamedUrl ): Promise<ErrorsAnd<TestInExpectedActualOut<any>>> {
  return mapErrorsK ( await engine.loadNamed ( inpTestName ),
    async inp => mapErrorsK ( await engine.loadNamed ( outTestName ),
      async out => {
        let namedLoadResult: TestInExpectedActualOut<any> = { input: inp.result, expectedOutput: out.result, actualOutput: await tx ( inp.result ) };
        return namedLoadResult;
      } ) )

}
export async function valuesToTestResults ( engine: TestEngine, schemas: TestInOut<any>, values: TestInExpectedActualOut<any> ): Promise<TestResults> {
  const schemaResults: TestInExpectedActualOut<SchemaTestResult> = {
    input: engine.testSchema ( schemas.input, values.input ),
    actualOutput: engine.testSchema ( schemas.output, values.actualOutput ),
    expectedOutput: engine.testSchema ( schemas.output, values.expectedOutput )
  }
  const transformerResults: TransformerTestResult = await engine.testTransformer ( values.expectedOutput, values.actualOutput )
  return { schema: schemaResults, transformer: transformerResults }
}

async function runOneTest ( engine: TestEngine, schemasAndTx: SchemasAndTransformer, test: string ): Promise<OneTestResult> {
  const inpTestName = schemaNameToTestName ( 'input_sample' ) ( schemasAndTx.schemaNames.input, test )
  const outTestName = schemaNameToTestName ( 'output_sample' ) ( schemasAndTx.schemaNames.output, test )

  let result = await mapErrorsK ( await loadTestValues ( engine, schemasAndTx.schemaNames, schemasAndTx.tx, inpTestName, outTestName ),
    async values => mapErrors ( await valuesToTestResults ( engine, schemasAndTx.schemas, values ),
      results => {
        let ran: RanTestResult = {
          input: { name: inpTestName, value: values.input, result: results.schema.input },
          expectedOutput: { name: outTestName, value: values.expectedOutput, result: results.schema.expectedOutput },
          actualOutput: { value: values.actualOutput, result: results.transformer }
        };
        return ran
      }
    ) )
  if ( hasErrors ( result ) ) return { errors: result }
  return result
}

export const runTestsUsingEngine = ( engine: TestEngine ): RunTests =>
  async ( defn: RunTestsDefn ): Promise<ErrorsAnd<TestsResult>> => {
    const { schema, transformer, tests } = defn
    return mapErrorsK ( await loadSchemasAndTransformer ( engine, schema, transformer ),
      async ( schemasAndTransformer ) => {
        const testResults: OneTestResult[] = await mapK ( tests, async test => runOneTest ( engine, schemasAndTransformer, test ) )
        let testResult: TestsResult = {
          transformer: { name: defn.transformer, transformerDesc: schemasAndTransformer.transformerDesc },
          inputSchema: { name: schema.input, schema: schemasAndTransformer.schemas.input },
          outputSchema: { name: schema.output, schema: schemasAndTransformer.schemas.output },
          tests: testResults
        };
        return testResult
      } )
  }
