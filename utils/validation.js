const Joi = require("joi");
const { FIELD_TYPES } = require("../types/fieldTypes");

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Username must only contain letters and numbers",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 30 characters long",
    "any.required": "Username is required",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"))
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base":
        "Password must contain one lowercase letter, one uppercase letter and one number",
      "any.required": "Password is required",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).messages({
    "string.alphanum": "Username must contain only letters and numbers",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 30 characters long",
  }),
});

const bulkActionSchema = Joi.object({
  action: Joi.string()
    .valid("block", "unblock", "delete", "makeAdmin", "removeAdmin")
    .required(),
  userIds: Joi.array().items(Joi.string()).min(1).max(50).required(),
});

const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).default(""),
  sortBy: Joi.string()
    .valid("username", "email", "role", "isActive", "createdAt", "updatedAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  status: Joi.string().valid("all", "active", "inactive").default("all"),
  role: Joi.string().valid("all", "user", "admin").default("all"),
});

const getFieldSchema = (fieldType) => {
  switch (fieldType) {
    case FIELD_TYPES.SINGLE_TEXT:
      return Joi.string().max(500).allow(null, ""); 
    case FIELD_TYPES.MULTI_TEXT:
      return Joi.string().max(5000).allow(null, "");
    case FIELD_TYPES.NUMBER:
      return Joi.number().allow(null, "");
    case FIELD_TYPES.DOCUMENT_LINK:
      return Joi.string().uri().allow(null, "");
    case FIELD_TYPES.BOOLEAN:
      return Joi.boolean().allow(null, "");
    default:
      return Joi.any().forbidden(); 
  }
};

const buildValidationSchema = (customFields) => {
  const schemaShape = {};

  for (const field of customFields) {
    schemaShape[field.title] = getFieldSchema(field.fieldType);
  }

  return Joi.object(schemaShape);
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  bulkActionSchema,
  userQuerySchema,
  buildValidationSchema
};
