const express = require('express')
const threadController = require('../controllers/threadController')

const router = express.Router()

router.post('/', threadController.postThread)
router.get('/', threadController.getThreads)
router.get("/username/:username", threadController.getThreadByUsername)

router.get('/:id/messages', threadController.getThreadByIdMessages)
router.get('/:id', threadController.getThreadById)

router.patch("/:id/status", threadController.patchStatus)
router.patch("/:id/assign", threadController.patchAssign)


module.exports = router;












