const express = require("express");
const { getActiveJobs, getJobPoster } = require("../controllers/jobController");

const router = express.Router();

router.param("id", (req, res, next, value) => {
  if (!/^\d+$/.test(value)) {
    return res.status(400).json({ success: false, message: "ID khong hop le." });
  }
  return next();
});

router.get("/", getActiveJobs);
router.get("/:id/poster", getJobPoster);

module.exports = router;
