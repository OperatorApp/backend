const express = require('express')
const aiController = require('../controllers/aiController')

const router = express.Router()

router.post('/customerSimulation', aiController.customerSimulation)



module.exports = router;

