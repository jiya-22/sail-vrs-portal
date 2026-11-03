const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
  submitApplication,
  listApplications,
  getApplication,
  updateStatus,
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/", authenticate, authorize("employee"), submitApplication);
router.get("/", authenticate, listApplications);
router.get("/:id", authenticate, getApplication);
router.patch("/:id/status", authenticate, authorize("admin"), updateStatus);

module.exports = router;
