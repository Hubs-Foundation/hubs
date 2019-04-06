// Recursively checks all values in the input to make sure they pass the predicates specified in the schema.
// Throws an exception if any part of the input is invalid.
export default function validate(input, schema) {
  if (Array.isArray(schema)) {
    if (!Array.isArray(input)) {
      throw new Error(`Required array, found ${input}.`);
    }
    const itemSchema = schema[0];
    for (const item of input) {
      validate(item, itemSchema);
    }
  } else if (typeof schema === "object") {
    if (!(typeof input === "object" && input !== null)) {
      throw new Error(`Required object, found ${input}.`);
    }
    for (const key in schema) {
      validate(input[key], schema[key]);
    }
  } else if (input != null && !schema(input)) {
    throw new Error(`Invalid value for schema: ${input}.`);
  }
}
