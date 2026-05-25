const express = require("express");
const { getActiveJobs } = require("../controllers/jobController");

const router = express.Router();

router.get("/", getActiveJobs);

module.exports = router;
