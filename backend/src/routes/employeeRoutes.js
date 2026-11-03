const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createEmployee,
  listEmployees,
  getEmployee,
  getGradingHistory,
} = require("../controllers/employeeController");

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createEmployee);
router.get("/", authenticate, authorize("admin"), listEmployees);
router.get("/:id", authenticate, getEmployee);
router.get("/:id/grading-history", authenticate, getGradingHistory);

module.exports = router;
