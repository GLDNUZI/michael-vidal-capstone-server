// Importing required modules and initializing them
// const knex = require('knex')(require('../knexfile')); // Initialize Knex with database configuration
const passport = require('passport'); // Passport library for authentication
require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Express framework for web applications
const router = express.Router(); // Router for handling routes in Express
const { OAuth2Client } = require('google-auth-library'); // OAuth2 client for Google authentication
const client = new OAuth2Client(); // Instance of OAuth2Client for Google authentication
const HMS = require("@100mslive/server-sdk"); // 100ms Live server SDK for video conferencing
const HMSClientWeb = require('../hmsClientWeb.js'); // Custom module for HMS client
const axios = require('axios'); // Axios for making HTTP requests
const hmsClient = new HMS.SDK(process.env.ACCESS_KEY, process.env.ACCESS_SECRET); // Initialize HMS SDK with access key and secret
console.log(process.env.ACCESS_KEY, process.env.ACCESS_SECRET);

// Duplicate dotenv configuration (not necessary if already loaded)
require('dotenv').config();
const template_id = process.env.TEMPLATE_ID;


// Route setup for Google OAuth2 authentication
router.get('/google', passport.authenticate('google'));

// Setting up multer for file upload handling
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('public/uploads/')); // Set destination for file uploads
    },
    filename: function (req, file, cb) {
        // Set filename for file uploads
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }); // Initialize multer with the defined storage

// Function to get user profile
// const getProfile = async (req, res) => {
//     if (!req.user) {
//         // Check if the user is logged in
//         return res.status(401).json({ message: "Not logged in" });
//     }
//     const userId = req.user.id; // Retrieve user ID from the request
//     const { username, email } = req.body; // Extract username and email from request body
//     let avatarUrl = req.user.avatar_url || 'default_avatar_url'; // Set default or existing avatar URL

//     if (req.file) {
//         // Check if an avatar file is uploaded
//         avatarUrl = "http://localhost:3001/uploads/" + req.file.filename; // Update avatar URL
//     }

//     // Update user information in the database
//     knex('users')
//         .where({ id: userId })
//         .update({
//             username: username,
//             email: email,
//             avatar_url: avatarUrl
//         })
//         .then(() => {
//             // Respond with updated user information
//             res.json({
//                 message: 'Profile updated successfully',
//                 updatedData: {
//                     username: username,
//                     email: email,
//                     avatar_url: avatarUrl
//                 }
//             });
//         })
//         .catch(err => {
//             // Handle errors during database update
//             console.error('Error updating user profile:', err);
//             res.status(500).json({ message: 'Error updating profile' });
//         });
// };

// Function to update a room
const updateRoom = async (req, res) => {
    const name = req.body.roomName; // Get room name from request body
    const roomId = req.body.roomId; // Get room ID from request body

    try {
        const params = { name }; // Parameters for room update
        const updatedRoom = await hmsClient.rooms.update(roomId, params); // Update room using HMS SDK
        res.status(200).json(updatedRoom); // Send updated room information
    } catch (e) {
        res.status(201).json({ 'error': e.message }); // Handle errors
    }
};

// Function to create a room
const createRoom = async (req, res) => {
    const roomName = req.body.room; // Get room name from request body
    const roomCreateOptions = {
        'name': roomName,
        "description": 'testing',
        'template_id': template_id,
    };

    try {
        const room = await hmsClient.rooms.create(roomCreateOptions); // Create room using HMS SDK
        // console.log(result);
        if (room && !room.enabled) {
            // Check if room creation was successful but room is disabled
            const result2 = await hmsClient.rooms.enableOrDisable(room.id, true); // Enable the room
            // console.log('create result2', result2);
        }
        res.status(200).json(result); // Send room creation result
    } catch (e) {
        console.log('create err', e);
        res.status(201).json({ 'error': e.message }); // Handle errors
    }
};

// Function to update room status
const updateRoomStatus = async (req, res) => {
    const roomId = req.body.roomid; // Get room ID from request body

    try {
        const result = await hmsClient.rooms.enableOrDisable(roomId, false); // Disable the room using HMS SDK
        console.log(result);
        res.status(200).json(result); // Send room status update result
    } catch (e) {
        res.status(201).json({ 'error': e.message }); // Handle errors
    }
};

// Function to get rooms
const getRooms = async (req, res) => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1); // Calculate date for yesterday
        const authToken = await hmsClient.auth.getManagementToken(); // Get management token from HMS SDK
        const hmsClientWeb = new HMSClientWeb(authToken?.token); // Initialize custom HMS client web module

        let rooms = await hmsClientWeb.getRooms({ enabled: true, limit: 100 }) || []; // Get rooms from HMS SDK

        console.log(rooms);
        if (rooms && rooms.length > 0) {
            rooms = rooms.filter(item => {
                return new Date(item.created_at) > yesterday || item.enabled; // Filter rooms created after yesterday
            });
        }
        res.status(200).json(rooms); // Send rooms information
    } catch (err) {
        res.status(500).json({ message: err.message }); // Handle errors
    }
};

const handleRecording = async (req, res) => {
    console.log('hhandleRecordinga', req.body);
    try {
        const roomId = req.body.roomId;
        const isEnabled = req.body.enable;

        const authToken = await hmsClient.auth.getManagementToken(); // Get management token from HMS SDK
        const hmsClientWeb = new HMSClientWeb(authToken?.token); // Initialize custom HMS client web module

        let result;
        if (isEnabled) {
            console.log(' start recoding ');
            result = await hmsClientWeb.startRecording(roomId); // Get rooms from HMS SDK
        } else {
            console.log(' stop recoding ', roomId);
            result = await hmsClientWeb.stopRecording(roomId); // Get rooms from HMS SDK            
        }
        console.log('handleRecording rss', result);
        res.status(200).json(result); // Send rooms information
    } catch (err) {
        console.log('handleRecording catch', err.response);
        res.status(200).json({ error: err }); // Handle errors
    }
}

const listRecordings = async (req, res) => {
    console.log('listRecordings', req.body);
    const roomId = req.body.roomId;
    console.log('query ', roomId);
    try {
        const authToken = await hmsClient.auth.getManagementToken(); // Get management token from HMS SDK
        const hmsClientWeb = new HMSClientWeb(authToken?.token); // Initialize custom HMS client web module

        const result = await hmsClientWeb.listRecording({ room_id: roomId, limit: 10 }); // Get rooms from HMS SDK
        console.log('listRecordings result', result);
        const mp4s = result.filter(item => item.path.endsWith('.mp4'));
        mp4s.length = Math.min(mp4s.length, 5);
        console.log('listRecordings mp4s', mp4s);
        res.status(200).json(mp4s); // Send rooms information
    } catch (err) {
        console.log('listRecordings listRecordings', err);
        // res.status(200).json({ error: err.response }); // Handle errors
    }
}
const urlRecordings = async (req, res) => {
    console.log('urlrecoding', req.query.asset_id);
    try {
        const authToken = await hmsClient.auth.getManagementToken(); // Get management token from HMS SDK
        // console.log('token', authToken?.token);
        const hmsClientWeb = new HMSClientWeb(authToken?.token); // Initialize custom HMS client web module

        const result = await hmsClientWeb.urlRecording(req.query.asset_id); // Get rooms from HMS SDK
        console.log('listRecordings result', result);
        res.status(200).json(result); // Send rooms information
    } catch (err) {
        console.log('listRecordings listRecordings', err.message);
        // res.status(200).json({ error: err.response }); // Handle errors
    }
    // Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjU1NzliY2U2ODExMWY2ZmU0YjU3ZTQyIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3MDEyMDY5ODUsIm5iZiI6MTcwMTIwNjk4NSwiZXhwIjoxNzAxMjkzMzg1LCJqdGkiOiJkNzQ2ZGZhMC04YWUzLTQ0NzUtODM4OS01ODhlNjRjNDYxOWMifQ.GioyoW2SB07jV6m55Y8_ktFw1hLNYaYwdE7uGmvTc3s

}

// 656641b4f3e94c98426c0a92
// gs://gcp-us-east1-prod-us2-recording/65579bce68111f6fe4b57e40/65579bce68111f6fe4b57e41/655ab832c75a69c5f8103515/room-composite/20231128/65664551a8621158609a4b7e/Rec-65662136ace8b508c1831846-1701201234671.mp4

// const getRecendRecordingOfRoom = async (req, res) => {
//     console.log('hhandleRecordinga', req.body);
//     try {
//         const authToken = await hmsClient.auth.getManagementToken(); // Get management token from HMS SDK
//         const hmsClientWeb = new HMSClientWeb(authToken?.token); // Initialize custom HMS client web module

//         const result = await hmsClientWeb.listRecording(); // Get rooms from HMS SDK
//         console.log('listRecordings rss', result);
//         res.status(200).json(result); // Send rooms information
//     } catch (err) {
//         console.log('listRecordings catch', err.response);
//         res.status(200).json({ error: err.response }); // Handle errors
//     }
// }

// // Function to get current user information
// const getMe = async (req, res) => {
//     if (req.session.userId) {
//         const user = await knex("users").where({ id: req.session.userId.toString() }); // Query user from database
//         return res.json({ userId: req.session.userId, user: user[0] }); // Send user information
//     } else {
//         return res.status(401).json({ message: "Not logged in" }); // Handle not logged in case
//     }
// };

// // Function for user authentication
// const authenticate = async (req, res) => {
//     const result = await client.verifyIdToken({
//         idToken: req.body.token,
//         audience: process.env.GOOGLE_CLIENT_ID // Google client ID for verification
//     });
//     const payload = result.getPayload(); // Extract payload from token

//     knex('users')
//         .select('id')
//         .where({ google_id: payload.sub }) // Query user from database using Google ID
//         .then((user) => {
//             if (user.length) {
//                 req.session.userId = user[0].id; // Set session user ID
//                 console.log({ user });
//                 res.status(200).json({ "status": 200, message: "found existing user" }); // User found
//             } else {
//                 // User not found, create new user
//                 knex('users')
//                     .insert({
//                         username: payload.name,
//                         google_id: payload.sub,
//                         avatar_url: payload.picture,
//                         email: payload.email,
//                     })
//                     .then((userId) => {
//                         req.session.userId = userId; // Set session user ID
//                         res.status(200).json({ "status": 200, message: "Created user" }); // User created
//                     })
//                     .catch((err) => {
//                         console.error(err);
//                         res.status(400).json({ message: " Error creating user" }); // Handle errors
//                     });
//             }
//         })
//         .catch((err) => {
//             res.status(400).json({ "status": 200 }); // Handle errors
//         });
// };

// Test function
const getTest = async (req, res) => {
    res.status(200).json({ 'msg': 'test', 'cookie': req.cookies }); // Send test response
};

// Export the module with all functions
module.exports = {
    // getProfile,
    getTest,
    updateRoom,
    createRoom,
    getRooms,
    // getMe,
    updateRoomStatus,
    // authenticate,
    handleRecording,
    listRecordings,
    urlRecordings
};
