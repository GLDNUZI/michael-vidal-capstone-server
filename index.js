const dotenv = require('dotenv');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
// const cors = require('cors');
const helmet = require('helmet');
// const KnexSessionStore = require('connect-session-knex')(session);
const roomRouter = require('./routes/room.js')
require("express-async-errors")
// Initialize dotenv configuration
dotenv.config();

// const knex = require('knex')(require('./knexfile.js'));

// Initialize Express app
const app = express();

// Enable serving static files from 'uploads' directory
app.use(express.static('public'));

// Initialize HTTP Headers middleware
app.use(helmet());

// Parse JSON payloads
app.use(express.json());


// Enable CORS
app.use(cors({
    origin: ['http://localhost:3000', process.env.REACT_FRONTEND_URL],
    credentials: true,
}));

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

// // Configure session storage
// const store = new KnexSessionStore({
//     knex: knex,
//     tablename: 'sessions',
//     sidfieldname: 'sid',
//     clearInterval: 30 * 1000 * 60,
// });

// Configure session
app.set('trust proxy', 1)
app.use(session({
    // store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 1000 * 60, sameSite: process.env.NODE_ENV == "production" ? "none" : 'lax', secure: process.env.NODE_ENV == "production" ? "true" : 'auto' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/', roomRouter);


// app.use(async (req, res, next) => {

//     if (!req.session.userId)
//         return next()

//     const users = await knex('users').where({ id: req.session.userId })
//     if (users[0]) {
//         req.user = users[0]
//     }
//     next()
// })

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


// // Passport configuration for Google OAuth
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:3001/oauth2callback"
// }, function (accessToken, refreshToken, profile, cb) {
//     // Handle user data returned by Google

//     knex('users')
//         .select('id')
//         .where({ google_id: profile.id })
//         .then((user) => {
//             if (user.length) {
//                 cb(null, user[0]);
//             } else {

//                 knex('users')
//                     .insert({
//                         username: profile._json.name,
//                         google_id: profile.id,
//                         avatar_url: profile._json.picture,
//                     })
//                     .then((userId) => {

//                         cb(null, { id: userId[0] });
//                     })
//                     .catch((err) => {

//                     });
//             }
//         })
//         .catch((err) => {
//             console.log('Error fetching a user', err);
//         });
//     return cb(null, profile);
// }));

// Serialize user for session
passport.serializeUser(function (user, done) {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

app.get('/oauth2callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/');
    });

app.post("/100msWebhook", (req, res) => {
    console.log(req.body) // Call your action on the request here
    res.status(200).end() // Responding is important
})
// Start the server
app.listen(process.env.PORT || 3001, () => {
    console.log('Server started on http://localhost:3001');
});

