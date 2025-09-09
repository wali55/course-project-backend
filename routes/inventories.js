const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getAllCategories,
  getTagsWithAutocomplete,
  getUserInventories,
  getSingleInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  uploadInventoryImage,
} = require("../controllers/inventoriesController");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/image", authenticate, upload.single('image'), uploadInventoryImage);
router.get("/categories", getAllCategories);
router.get("/tags", getTagsWithAutocomplete);
router.get("/", authenticate, getUserInventories);
router.post("/", authenticate, createInventory);
router.get("/:id", authenticate, getSingleInventory);
router.put("/:id", authenticate, updateInventory);
router.delete("/:id", authenticate, deleteInventory);

module.exports = router;
