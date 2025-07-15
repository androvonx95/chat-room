const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/', roomController.createRoom);
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.post('/:roomId/join', roomController.joinRoom);
router.post('/:roomId/messages', roomController.sendRoomMessage);
router.get('/:roomId/messages', roomController.getRoomMessages);

module.exports = router;