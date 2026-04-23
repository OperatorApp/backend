const express = require('express')
const aiController = require('../controllers/aiController')
const {validateApiKey} = require("../middleware/apiKeyMiddleware");
const {authenticateAny} = require("../middleware/authenticateAnyMiddleware");
const {authenticateToken} = require("../middleware/authMiddleware");

const router = express.Router()

router.post('/customerSimulation', validateApiKey, aiController.customerSimulation)
router.post("/knowledge", validateApiKey, aiController.upsertKnowledge)
router.post('/knowledge/query', authenticateAny, aiController.queryKnowledge)
router.post('/prompt-button', authenticateToken, aiController.createPromptButton)
router.get('/prompt-button', authenticateToken, aiController.getPromptButtons)
router.delete('/prompt-button/:buttonId', authenticateToken, aiController.deletePromptButton)
router.patch('/prompt-button', authenticateToken, aiController.upsertPromptButton)
router.post('/prompt-button/fire', authenticateToken, aiController.firePromptButton)

module.exports = router;

