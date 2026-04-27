const express = require('express')
const authController = require('../controllers/operatorController')
const {authenticateToken} = require("../middleware/authMiddleware");

const router = express.Router()


router.patch("/update-languages", authenticateToken, authController.updateLanguage)
router.get("/languages", authenticateToken, authController.getLanguages)

module.exports = router;

