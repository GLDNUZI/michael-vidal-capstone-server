
const express = require('express');
const router = express.Router();

const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
const HMSClientWeb = require('../hmsClientWeb.js');
const axios = require('axios');
const knex = require('knex')(require('../knexfile.js'));
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
router.post('/profile', upload.single('avatar'), roomController.getProfile);

router.post('/updateRoom', roomController.updateRoom);

// Endpoint for creating a room
router.post('/createRoom', roomController.createRoom);

// Endpoint for getting room list
router.get('/getrooms', roomController.getRooms);

// Endpoint for getting rooms with running status details
router.get('/getrooms2', roomController.getrooms2);

router.get("/me", roomController.getMe)
// Endpoint for user authentication
router.post('/authenticate', roomController.authenticate);

// Google OAuth routes
router.get('/auth/google',
	passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

router.get('/oauth2callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function (req, res) {
		res.redirect('/');
	});

// Default route
router.get('/', function (req, res) {
	res.redirect('http://localhost:3000');
});

// Test endpoint
router.get('/test', roomController.getTest);


// Export this module
module.exports = router;