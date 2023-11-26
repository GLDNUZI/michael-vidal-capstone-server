const dotenv = require('dotenv');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client();
const helmet = require('helmet');
// const http = require('https');
// const axios = require('axios');
// const multer = require('multer');
const KnexSessionStore = require('connect-session-knex')(session);
const HMS = require("@100mslive/server-sdk");
const path = require("path");
const HMSClientWeb = require('./hmsClientWeb.js');
const roomRouter = require('./routes/room.js')
require("express-async-errors")
// Initialize dotenv configuration
dotenv.config();

const knex = require('knex')(require('./knexfile.js'));

// HMS SDK Client Initialization
const hmsClient = new HMS.SDK(process.env.ACCESS_KEY, process.env.ACCESS_SECRET);

// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join('public/uploads/'));
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage: storage });

// Initialize Express app
const app = express();

// Enable serving static files from 'uploads' directory
app.use(express.static('public'));

// Initialize HTTP Headers middleware
app.use(helmet());

// Parse JSON payloads
app.use(express.json());


// Enable CORS
// app.use(cors({
//     origin: ['http://localhost:3000', process.env.REACT_FRONTEND_URL],
//     credentials: true,
// }));

app.use((req, res, next) => {
    // Set the Access-Control-Allow-Origin to the incoming Origin value
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    // Allow credentials
    res.header('Access-Control-Allow-Credentials', true);

    // Set headers that are allowed in CORS
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Set methods that are allowed in CORS
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Configure session storage
const store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions',
    sidfieldname: 'sid',
    clearInterval: 30 * 1000 * 60,
});

// Configure session

console.log(process.env);
app.use(session({
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:  { secure: 'auto', maxAge: 30 * 1000 * 60,  }

   // cookie: process.env.NODE_ENV === "production" ? { secure: true, maxAge: 30 * 1000 * 60, sameSite: "None", httpOnly: true } : { secure: 'auto', maxAge: 30 * 1000 * 60 }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/', roomRouter);


app.use(async (req, res, next) => {

    if (!req.session.userId)
        return next()

    const users = await knex('users').where({ id: req.session.userId })
    if (users[0]) {
        req.user = users[0]
    }
    next()
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    console.error(err.message);
    if (err.response) {

        console.log(err.response.config.url)
        console.log("Body -- ")
        console.log(err.response.body)
    }
    res.status(500).json({ message: err.message })
})


// Passport configuration for Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/oauth2callback"
}, function (accessToken, refreshToken, profile, cb) {
    // Handle user data returned by Google

    knex('users')
        .select('id')
        .where({ google_id: profile.id })
        .then((user) => {
            if (user.length) {
                cb(null, user[0]);
            } else {

                knex('users')
                    .insert({
                        username: profile._json.name,
                        google_id: profile.id,
                        avatar_url: profile._json.picture,
                    })
                    .then((userId) => {

                        cb(null, { id: userId[0] });
                    })
                    .catch((err) => {

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

// // Profile update endpoint with avatar upload
// app.post('/profile', upload.single('avatar'), (req, res) => {
//     if (!req.user) {
//         return res.status(401).json({ message: "Not logged in" })
//     }
//     // Assuming user ID is stored in the session or token
//     const userId = req.user.id;

//     // Extract user data from request body
//     const { username, email } = req.body;

//     // Initialize avatarUrl with the existing URL or a default
//     let avatarUrl = req.user.avatar_url || 'default_avatar_url';

//     // If an avatar file is uploaded, update the avatarUrl
//     if (req.file) {
//         avatarUrl = "http://localhost:3001/uploads/" + req.file.filename
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
//             console.error('Error updating user profile:', err);
//             res.status(500).json({ message: 'Error updating profile' });
//         });
// });

// app.post('/updateRoom', async (req, res) => {

//     const name = req.body.roomName;
//     const roomId = req.body.roomId;

//     try {
//         const params = { name };
//         const updatedRoom = await hmsClient.rooms.update(roomId, params);

//         res.status(200).json(updatedRoom);
//     } catch (e) {
//         res.status(201).json({ 'error': e.message });
//     }
// });

// // Endpoint for creating a room
// app.post('/createRoom', async (req, res) => {
//     const name = req.body.room;
//     const roomCreateOptions = {
//         'name': name,
//         "description": 'testing',
//         'template_id': '655ab832c75a69c5f8103515',
//     };

//     try {

//         const roomWithOptions = await hmsClient.rooms.create(roomCreateOptions);
//         res.status(200).json(roomWithOptions);
//     } catch (e) {

//         res.status(201).json({ 'error': e.message });
//     }
// });

// // Endpoint for getting room list
// app.get('/getrooms', async (req, res) => {
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     const authToken = await hmsClient.auth.getManagementToken()
//     const hmsClientWeb = new HMSClientWeb(authToken?.token)


//     let rooms = await hmsClientWeb.getRooms({ enabled: true, after: yesterday })

//     if (rooms && rooms.length > 0) {
//         rooms = rooms.filter(item => {

//             return true
//             return new Date(item.created_at) > yesterday;
//         })

//     }

//     res.status(200).json(rooms);
// });

// // Endpoint for getting rooms with specific details
// app.get('/getrooms2', async (req, res) => {
//     const result = await axios.get('https://api.100ms.live/v2/live-streams', {
//         headers: {
//             'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDA5NTE0NTUsImV4cCI6MTcwMTAzNzg1NSwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDA5NTE0NTUsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.L-ro4k4g9ILBxIiQr_UBJUFOpxQuyg2iOJda7fI6uVU'
//         },
//     });

//     const data = result.data.data.filter(item => item.status === 'running');

//     res.status(200).json(data);
// });

// app.get("/me", async (req, res) => {
//     if (req.session.userId) {
//         const user = await knex("users").where({ id: req.session.userId })
//         return res.json({ userId: req.session.userId, user: user[0] })
//     } else {
//         return res.status(401).json({ message: "Not logged in" })
//     }
// })
// // Endpoint for user authentication
// app.post('/authenticate', async (req, res) => {
//     // 
//     const result = await client.verifyIdToken({
//         idToken: req.body.token,
//         audience: process.env.GOOGLE_CLIENT_ID
//     });
//     // 
//     const payload = result.getPayload();

//     knex('users')
//         .select('id')
//         .where({ google_id: payload.sub })
//         .then((user) => {
//             if (user.length) {

//                 req.session.userId = user[0].id
//                 res.status(200).json({ "status": 200, message: "found existing user" });
//             } else {

//                 knex('users')
//                     .insert({
//                         username: payload.name,
//                         google_id: payload.sub,
//                         avatar_url: payload.picture,
//                         email: payload.email,
//                     })
//                     .then((userId) => {


//                         req.session.userId = userId

//                         res.status(200).json({ "status": 200, message: "Created user" });
//                     })
//                     .catch((err) => {

//                         res.status(400).json({ message: " Error creating user" });
//                     });
//             }
//         })
//         .catch((err) => {

//             res.status(400).json({ "status": 200 });
//         });
// });

// // Google OAuth routes
// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

app.get('/oauth2callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/');
    });

// // Default route
// app.get('/', function (req, res) {
//     res.redirect('http://localhost:3000');
// });

// // Test endpoint
// app.get('/test', function (req, res) {

//     res.status(200).json({ 'msg': 'test', 'cookie': req.cookies });
// });

// Start the server
app.listen(process.env.PORT || 3001, () => {
    console.log('Server started on http://localhost:3001');
});
