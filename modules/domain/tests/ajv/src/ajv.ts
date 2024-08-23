import Ajv from "ajv"
import { SchemaTestError, TestSchemaFn } from "@fusionconfig/tests";
import { toArray } from "@laoban/utils";

const ajv = new Ajv ( { allErrors: true } )
export const ajvTest: TestSchemaFn = ( schema: any, data: any ) => {
  const validate = ajv.compile ( schema )
  const valid = validate ( data )
  return valid ? [] : toArray(validate.errors).map ( e =>
    ({ path: e?.instancePath, message: e?.message }) as SchemaTestError)
}