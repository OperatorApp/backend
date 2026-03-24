const express = require('express')
const threadController = require('../controllers/threadController')

const router = express.Router()




router.post('/', threadController.postThread)
router.get('/:id', threadController.getThreadById)
router.get('/:id/messages', threadController.getThreadByIdMessages)
router.get('/', threadController.getThreads)

router.patch("/:id/status", threadController.patchStatus)
router.patch("/:id/assign", threadController.patchAssign)


module.exports = router;












