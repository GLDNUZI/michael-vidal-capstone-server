
const express = require('express');
const router = express.Router();

const passport = require('passport');
const roomController = require('../controllers/room-controller.js');
require('dotenv').config();

router.get('/google', passport.authenticate('google'));
const multer = require('multer');
// Configure Multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join('public/uploads/'));
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});
const upload = multer({ storage: storage });
// Profile update endpoint with avatar upload
// router.post('/profile', upload.single('avatar'), roomController.getProfile);

router.post('/updateRoom', roomController.updateRoom);

router.post('/disableRoom', roomController.updateRoomStatus);

// Endpoint for creating a room
router.post('/createRoom', roomController.createRoom);

// Endpoint for getting room list
router.get('/getrooms', roomController.getRooms);

// router.get("/me", roomController.getMe);
// Endpoint for user authentication
// router.post('/authenticate', roomController.authenticate);

router.post('/handleRecording', roomController.handleRecording);

router.post('/listRecordings', roomController.listRecordings);

// https://localhost:3001/urlRecordings?asset_id=656641b4f3e94c98426c0a92

router.get('/urlRecordings', roomController.urlRecordings);

// Google OAuth routes
router.get('/auth/google',
	passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

// Default route
router.get('/', function (req, res) {
	res.redirect('http://localhost:3000');
});

// Test endpoint
router.get('/test', roomController.getTest);


// Export this module
module.exports = router;