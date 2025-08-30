const express = require("express");
const {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
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
// router.put("/users/:userId/role", updateUserRole);
// router.put("/users/:userId/status", toggleUserStatus);
// router.delete("/users/:userId", deleteUser);
router.post("/users/bulk-actions", validateBulkAction, bulkUserActions);

module.exports = router;
