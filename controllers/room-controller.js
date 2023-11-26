const knex = require('knex')(require('../knexfile'));

const passport = require('passport');

require('dotenv').config();

const express = require('express');
const router = express.Router();

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
const HMS = require("@100mslive/server-sdk");
const HMSClientWeb = require('../hmsClientWeb.js');
const axios = require('axios');
const hmsClient = new HMS.SDK(process.env.ACCESS_KEY, process.env.ACCESS_SECRET);

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

const getProfile = async (req, res) => {
    console.log(' get profile');
    if (!req.user) {
        return res.status(401).json({ message: "Not logged in" })
    }
    // Assuming user ID is stored in the session or token
    const userId = req.user.id;

    // Extract user data from request body
    const { username, email } = req.body;

    // Initialize avatarUrl with the existing URL or a default
    let avatarUrl = req.user.avatar_url || 'default_avatar_url';

    // If an avatar file is uploaded, update the avatarUrl
    if (req.file) {
        avatarUrl = "http://localhost:3001/uploads/" + req.file.filename
    }

    // Update user information in the database
    knex('users')
        .where({ id: userId })
        .update({
            username: username,
            email: email,
            avatar_url: avatarUrl
        })
        .then(() => {
            res.json({
                message: 'Profile updated successfully',
                updatedData: {
                    username: username,
                    email: email,
                    avatar_url: avatarUrl
                }
            });
        })
        .catch(err => {
            console.error('Error updating user profile:', err);
            res.status(500).json({ message: 'Error updating profile' });
        });
}

const updateRoom = async (req, res) => {
    const name = req.body.roomName;
    const roomId = req.body.roomId;

    try {
        const params = { name };
        const updatedRoom = await hmsClient.rooms.update(roomId, params);

        res.status(200).json(updatedRoom);
    } catch (e) {
        res.status(201).json({ 'error': e.message });
    }
}

const createRoom = async (req, res) => {
    const name = req.body.room;
    const roomCreateOptions = {
        'name': name,
        "description": 'testing',
        'template_id': '655ab832c75a69c5f8103515',
    };

    try {

        const roomWithOptions = await hmsClient.rooms.create(roomCreateOptions);
        res.status(200).json(roomWithOptions);
    } catch (e) {

        res.status(201).json({ 'error': e.message });
    }

}

const getRooms = async (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const authToken = await hmsClient.auth.getManagementToken()
    const hmsClientWeb = new HMSClientWeb(authToken?.token)


    let rooms = await hmsClientWeb.getRooms({ enabled: true, after: yesterday })

    if (rooms && rooms.length > 0) {
        rooms = rooms.filter(item => {

            return true
            return new Date(item.created_at) > yesterday;
        })

    }

    res.status(200).json(rooms);
}

// Endpoint for getting rooms with specific details
const getrooms2 = async (req, res) => {
    const authToken = await hmsClient.auth.getManagementToken()
    // 'Authorization': `Bearer ${authToken}`

    const result = await axios.get('https://api.100ms.live/v2/live-streams', {
        headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDEwMjE2ODAsImV4cCI6MTcwMTEwODA4MCwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDEwMjE2ODAsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.kcZyj2s8UbBGMlqty-3qqasgWfqgQfiRVWY1pbzo81c'
        },
    });

    const data = result.data.data.filter(item => item.status === 'running');

    res.status(200).json(data);
}


const getMe = async (req, res) => {
    if (req.session.userId) {
     
        const user = await knex("users").where({ id: req.session.userId.toString() })
        return res.json({ userId: req.session.userId, user: user[0] })
    } else {
        return res.status(401).json({ message: "Not logged in" })
    }
}

// Endpoint for user authentication
const authenticate = async (req, res) => {
    const result = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = result.getPayload();

    knex('users')
        .select('id')
        .where({ google_id: payload.sub })
        .then((user) => {
            if (user.length) {

                req.session.userId = user[0].id
                console.log({user})
                res.status(200).json({ "status": 200, message: "found existing user" });
            } else {

                knex('users')
                    .insert({
                        username: payload.name,
                        google_id: payload.sub,
                        avatar_url: payload.picture,
                        email: payload.email,
                    })
                    .then((userId) => {


                        req.session.userId = userId

                        res.status(200).json({ "status": 200, message: "Created user" });
                    })
                    .catch((err) => {
                        console.error(err)
                        res.status(400).json({ message: " Error creating user" });
                    });
            }
        })
        .catch((err) => {
            

            res.status(400).json({ "status": 200 });
        });
}

const getTest = async (req, res) => {
    res.status(200).json({ 'msg': 'test', 'cookie': req.cookies });
}


// Export this module
module.exports = {
    getProfile,
    getTest,
    updateRoom,
    createRoom,
    getRooms,
    getrooms2,
    getMe,
    authenticate
};