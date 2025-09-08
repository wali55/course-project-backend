const { validateAndProcessSchema } = require("../utils/validation");

const validateAndProcessFieldValues = (fieldValues, customFields) => {
  const schema = validateAndProcessSchema(customFields);

  const { value, error } = schema.validate(fieldValues, { abortEarly: false });

  if (error) {
    throw new Error(error.details.map(d => d.message).join(", "));
  }

  return value;
}

module.exports = {validateAndProcessFieldValues}