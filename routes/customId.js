const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getIdFormat,
  updateIdFormat,
  generatePreview,
} = require("../controllers/customIdController");
const router = express.Router();

router.get("/:inventoryId/id-format", authenticate, getIdFormat);
router.put("/:inventoryId/id-format", authenticate, updateIdFormat);
router.post("/id-format/preview", authenticate, generatePreview);

module.exports = router;
