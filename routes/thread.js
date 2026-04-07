const express = require('express')
const threadController = require('../controllers/threadController')
const { authenticateToken } = require('../middleware/authMiddleware')
const { validateApiKey } = require('../middleware/apiKeyMiddleware')
const { authenticateAny } = require('../middleware/authenticateAnyMiddleware')

const router = express.Router()

router.post('/',validateApiKey, threadController.postThread)
router.get('/', authenticateToken, threadController.getThreads)
router.get("/username/:username",authenticateAny, threadController.getThreadByUsername)

router.get('/:id/messages', threadController.getThreadByIdMessages)
router.get('/:id', threadController.getThreadById)

router.patch("/:id/status", threadController.patchStatus)
router.patch("/:id/assign", threadController.patchAssign)


module.exports = router;












