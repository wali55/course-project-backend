const { buildValidationSchema } = require("../utils/validation");
const prisma = require("../config/database");

const validateItemFieldValues = (fieldValues, customFields) => {
  const schema = buildValidationSchema(customFields);
  const { error } = schema.validate(fieldValues, { abortEarly: false });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.context.key] = detail.message;
    });

    return { isValid: false, errors };
  }

  return { isValid: true, errors: {} };
};

const validateItemFields = async (req, res, next) => {
  try {
    const { inventoryId } = req.params;
    const { fieldValues } = req.body;

    if (!fieldValues) {
      return next();
    }

    const customFields = await prisma.customField.findMany({
      where: { inventoryId },
    });

    const validation = validateItemFieldValues(fieldValues, customFields);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Invalid field values",
        fieldErrors: validation.errors,
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Field validation failed" });
  }
};

module.exports = { validateItemFields };