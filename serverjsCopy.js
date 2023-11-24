// const dotenv = require('dotenv');
// const express = require('express');
// // const knex = require('knex'); // Uncomment this line if you're using knex
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const session = require('express-session');
// const cors = require('cors')
// const { OAuth2Client } = require('google-auth-library')
// const client = new OAuth2Client();


// // Add http headers, small layer of security
// const helmet = require('helmet');


// dotenv.config();
// const knex = require('knex')(require('./knexfile.js'));


// const app = express();

// // Initialize HTTP Headers middleware
// app.use(helmet());

// app.use(express.json())
// // Enable CORS (with additional config options required for cookies)
// app.use(
//     cors({
//         origin: 'http://localhost:3000',
//         credentials: true,
//     })
// );


// // app.use(cors());
// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
//     next();
//     // req.setHeader('Access-Control-Allow-Origin', '*');
//     // req.setHeader('Access-Control-Allow-Origin', '*');
// })
// // Session configuration
// app.use(session({
//     secret: 'secret_key', // Replace with your own secret and ideally store it in .env
//     resave: false,
//     saveUninitialized: true,
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// // Passport configuration
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:3001/oauth2callback"
// }, function (accessToken, refreshToken, profile, cb) {
//     console.log("accessToken ", accessToken, refreshToken, profile, cb);
//     knex('users')
//         .select('id')
//         .where({ google_id: profile.id })
//         .then((user) => {
//             if (user.length) {
//                 // If user is found, pass the user object to serialize function
//                 cb(null, user[0]);
//             } else {
//                 // If user isn't found, we create a record
//                 console.log("insert");
//                 knex('users')
//                     .insert({
//                         username: profile._json.name
//                         , google_id: profile.id,
//                         avatar_url: profile._json.picture,
//                     })
//                     .then((userId) => {
//                         console.log("insert user id ", userId);
//                         // Pass the user object to serialize function
//                         cb(null, { id: userId[0] });
//                     })
//                     .catch((err) => {
//                         console.log('Error creating a user', err);
//                     });
//             }
//         })
//         .catch((err) => {
//             console.log('Error fetching a user', err);
//         });
//     return cb(null, profile);
// }
// ));


// passport.serializeUser(function (user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function (obj, done) {
//     done(null, obj);
// });
// // ,  "type": "module"

// app.post('/authenticate', async (req, res) => {
//     console.log(req.body);
//     const result = await client.verifyIdToken({
//         idToken: req.body.token,
//         audience: process.env.GOOGLE_CLIENT_ID
//     })
//     console.log('auth ', result.getPayload());
//     const payload = result.getPayload()

//     knex('users')
//         .select('id')
//         .where({ google_id: payload.sub })
//         .then((user) => {
//             if (user.length) {
//                 res.status(200).json({ "status": 200 });
//                 // If user is found, pass the user object to serialize function
//                 // cb(null, user[0]);
//             } else {
//                 // If user isn't found, we create a record
//                 console.log("insert");
//                 knex('users')
//                     .insert({
//                         username: payload.name
//                         , google_id: payload.sub,
//                         avatar_url: payload.picture,
//                         email: payload.email,
//                     })
//                     .then((userId) => {
//                         console.log("insert user id ", userId);
//                         res.status(200).json({ "status": 200 });
//                         // Pass the user object to serialize function
//                         // cb(null, { id: userId[0] });
//                     })
//                     .catch((err) => {
//                         console.log('Error creating a user', err);
//                         res.status(400).json({ "status": 200 });

//                     });
//             }
//         })
//         .catch((err) => {
//             console.log('Error fetching a user', err);
//             res.status(400).json({ "status": 200 });

//         });

//     // Passport stores authenticated user information on `req.user` object.
//     // Comes from done function of `deserializeUser`

//     // If `req.user` isn't found send back a 401 Unauthorized response
//     // if (req.user === undefined)
//     // 	return res.status(401).json({ message: 'Unauthorized' });

//     // If user is currently authenticated, send back user info
// });

// // Routes
// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

// app.get('/oauth2callback',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function (req, res) {
//         console.log('Google user profile:', req.user.id);

//         res.redirect('/');
//     });
// app.get('/', function (req, res) {
//     // res.send('Welcome to the application!');
//     res.redirect('http://localhost:3000');
// });

// app.listen(3001, () => {
//     console.log('Server started on http://localhost:3001');
// });



