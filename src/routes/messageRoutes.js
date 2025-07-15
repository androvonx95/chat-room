const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/direct', messageController.sendDirectMessage);
router.get('/direct/:userId1/:userId2', messageController.getDirectMessages);
router.get('/user/:userId', messageController.getUserMessages);

module.exports = router;