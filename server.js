const dotenv = require('dotenv');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
const helmet = require('helmet');
const http = require('https');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const KnexSessionStore = require('connect-session-knex')(session);
const HMS = require("@100mslive/server-sdk");

// Initialize dotenv configuration
dotenv.config();
const knex = require('knex')(require('./knexfile.js'));

// HMS SDK Client Initialization
const hmsClient = new HMS.SDK(process.env.ACCESS_KEY, process.env.ACCESS_SECRET);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize Express app
const app = express();

// Enable serving static files from 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Initialize HTTP Headers middleware
app.use(helmet());

// Parse JSON payloads
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

// Configure session storage
const store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions',
    sidfieldname: 'sid',
    clearInterval: 30 * 1000,
});

// Configure session
app.use(session({
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto', maxAge: 30 * 1000 }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    knex('sessions')
        .select('expired')
        .where({ sid: req.sessionID })
        .then((date) => {
            const serverDate = date[0]?.expired;
            res.cookie('expirationDate', serverDate);
            next();
        });
})

// Passport configuration for Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/oauth2callback"
}, function (accessToken, refreshToken, profile, cb) {
    // Handle user data returned by Google
    console.log("accessToken ", accessToken, refreshToken, profile, cb);
    knex('users')
        .select('id')
        .where({ google_id: profile.id })
        .then((user) => {
            if (user.length) {
                cb(null, user[0]);
            } else {
                console.log("insert");
                knex('users')
                    .insert({
                        username: profile._json.name,
                        google_id: profile.id,
                        avatar_url: profile._json.picture,
                    })
                    .then((userId) => {
                        console.log("insert user id ", userId);
                        cb(null, { id: userId[0] });
                    })
                    .catch((err) => {
                        console.log('Error creating a user', err);
                    });
            }
        })
        .catch((err) => {
            console.log('Error fetching a user', err);
        });
    return cb(null, profile);
}));

// Serialize user for session
passport.serializeUser(function (user, done) {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Routes

// Profile update endpoint with avatar upload
app.post('/profile', upload.single('avatar'), (req, res) => {
    // Assuming user ID is stored in the session or token
    const userId = req.user.id;

    // Extract user data from request body
    const { username, email } = req.body;

    // Initialize avatarUrl with the existing URL or a default
    let avatarUrl = req.user.avatar_url || 'default_avatar_url';

    // If an avatar file is uploaded, update the avatarUrl
    if (req.file) {
        avatarUrl = '/uploads/' + req.file.filename;
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
});


// Endpoint for creating a room
app.get('/createRoom', async (req, res) => {
    const name = "michaeldemo2";
    const roomCreateOptions = {
        'name': name,
        "description": 'testing',
        'template_id': '655ab832c75a69c5f8103515',
    };
    const roomWithOptions = await hmsClient.rooms.create(roomCreateOptions);
    console.log('roomWithOptions', roomWithOptions);
    res.status(200).json(roomWithOptions);
});

// Endpoint for getting room list
app.get('/getrooms2', async (req, res) => {
    const roomWithOptions = hmsClient.rooms.list();
    console.log('roomWithOptions', roomWithOptions);
    for await (const session of roomWithOptions) {
        if (!roomWithOptions.isNextCached) {
            console.log("the next loop is gonna take some time");
        }
    }
    res.status(200).json(roomWithOptions);
});

// Endpoint for getting rooms with specific details
app.get('/getrooms', async (req, res) => {
    const result = await axios.get('https://api.100ms.live/v2/live-streams', {
        headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDA4Mjg1NjUsImV4cCI6MTcwMDkxNDk2NSwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDA4Mjg1NjUsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.nCnCqJNcbMq1IjJefG1cHeSWQYtOXnVgsj5q15Vp0FY'
        },
        params: { room_id: '6560b0d6afd3b2853348d72c' }
    });
    const data = result.data.data;
    console.log('result ', ' ==========\n\n', data);
    res.status(200).json(data);
});

// Endpoint for user authentication
app.post('/authenticate', async (req, res) => {
    console.log('req.session.user', req.sessionID);
    const result = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    console.log('auth ', result.getPayload());
    const payload = result.getPayload();
    console.log(req.session.uid, payload.sub);
    knex('sessions');
    knex('users')
        .select('id')
        .where({ google_id: payload.sub })
        .then((user) => {
            if (user.length) {
                res.status(200).json({ "status": 200, message: "found existing user" });
            } else {
                console.log("insert");
                knex('users')
                    .insert({
                        username: payload.name,
                        google_id: payload.sub,
                        avatar_url: payload.picture,
                        email: payload.email,
                    })
                    .then((userId) => {
                      
                        console.log("insert user id ", userId);
                        res.status(200).json({ "status": 200, message: "Created user" });
                    })
                    .catch((err) => {
                        console.log('Error creating a user', err);
                        res.status(400).json({ message:" Error creating user" });
                    });
            }
        })
        .catch((err) => {
            console.log('Error fetching a user', err);
            res.status(400).json({ "status": 200 });
        });
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

app.get('/oauth2callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        console.log('Google user profile:', req.user.id);
        res.redirect('/');
    });

// Default route
app.get('/', function (req, res) {
    res.redirect('http://localhost:3000');
});

// Test endpoint
app.get('/test', function (req, res) {
    console.log(req.sessionID);
    res.status(200).json({ 'msg': 'test', 'cookie': req.cookies });
});

// Start the server
app.listen(3001, () => {
    console.log('Server started on http://localhost:3001');
});
