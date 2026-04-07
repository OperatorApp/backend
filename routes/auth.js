const express = require('express')
const authController = require('../controllers/authController')
const {authenticateToken} = require("../middleware/authMiddleware");

const router = express.Router()


router.post('/login', authController.login)
router.post('/sign-up', authController.signup)
router.post('/logout', authController.logout)

router.post('/create-api-key', authenticateToken, authController.createApiKey)



module.exports = router;

