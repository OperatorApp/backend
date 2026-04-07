const express = require('express')
const aiController = require('../controllers/aiController')
const {validateApiKey} = require("../middleware/apiKeyMiddleware");
const {authenticateAny} = require("../middleware/authenticateAnyMiddleware");

const router = express.Router()

router.post('/customerSimulation', validateApiKey, aiController.customerSimulation)
router.post("/knowledge", validateApiKey, aiController.upsertKnowledge)
router.post('/knowledge/query', authenticateAny, aiController.queryKnowledge)


module.exports = router;

