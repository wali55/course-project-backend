const { bulkActionSchema, userQuerySchema } = require("../utils/validation");

const validateBulkAction = (req, res, next) => {
  const { error } = bulkActionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

const validateUserQuery = (req, res, next) => {
  const { error, value } = userQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

module.exports = {
  validateBulkAction,
  validateUserQuery,
};
