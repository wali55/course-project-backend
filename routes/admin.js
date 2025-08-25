const express = require("express");
const {getAllUsers, updateUserRole, toggleUserStatus} = require("../controllers/adminController");
const {authenticate, requireAdmin} = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/users", getAllUsers);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId/status", toggleUserStatus);

module.exports = router;