const express = require("express");
const {
  getAllUsers,
  bulkUserActions,
  getUserStats,
} = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  validateBulkAction,
  validateUserQuery,
} = require("../middleware/validation");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/users", validateUserQuery, getAllUsers);
router.get("/users/stats", getUserStats);
router.post("/users/bulk-actions", validateBulkAction, bulkUserActions);

module.exports = router;
