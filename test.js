// npm install jsonwebtoken
// const dotenv = require('dotenv');
// const express = require('express');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const session = require('express-session');
// const cors = require('cors');
// const { OAuth2Client } = require('google-auth-library');
// const helmet = require('helmet');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');

// dotenv.config();
// const knex = require('knex')(require('./knexfile.js'));

// const app = express();
// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// // Enable CORS (with additional config options required for cookies)
// app.use(cors({
//     origin: 'http://localhost:3000', // Replace with your frontend URL
//     credentials: true,
// }));

// app.use(session({
//     secret: process.env.SESSION_SECRET, // Use an environment variable for the secret
//     resave: false,
//     saveUninitialized: true,
//     cookie: { httpOnly: true, secure: false } // Set secure: true in production with HTTPS
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:3001/oauth2callback"
// }, async (accessToken, refreshToken, profile, cb) => {
//     try {
//         let user = await knex('users')
//             .select('id')
//             .where({ google_id: profile.id })
//             .first();

//         if (!user) {
//             const [userId] = await knex('users').insert({
//                 username: profile._json.name,
//                 google_id: profile.id,
//                 avatar_url: profile._json.picture,
//             });
//             user = { id: userId };
//         }

//         return cb(null, user);
//     } catch (err) {
//         console.error('Error during user authentication:', err);
//         return cb(err, null);
//     }
// }));

// passport.serializeUser(function (user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function (obj, done) {
//     done(null, obj);
// });

// const client = new OAuth2Client();

// app.post('/authenticate', async (req, res) => {
//     try {
//         const ticket = await client.verifyIdToken({
//             idToken: req.body.token,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });
//         const payload = ticket.getPayload();

//         let user = await knex('users')
//             .select('id')
//             .where({ google_id: payload.sub })
//             .first();

//         if (!user) {
//             const [userId] = await knex('users').insert({
//                 username: payload.name,
//                 google_id: payload.sub,
//                 avatar_url: payload.picture,
//                 email: payload.email,
//             });
//             user = { id: userId };
//         }

//         const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
//         res.cookie('session_token', token, { httpOnly: true, secure: false }); // Set secure: true in production with HTTPS
//         res.status(200).json({ status: 'success' });
//     } catch (err) {
//         console.error('Error authenticating user:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// // Existing Google OAuth Routes
// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['profile'] }));

// app.get('/oauth2callback',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function (req, res) {
//         // Successful authentication, redirect home.
//         res.redirect('http://localhost:3000');
//     });

// // Sample protected route
// app.get('/protected', (req, res) => {
//     const token = req.cookies.session_token;
//     if (!token) {
//         return res.status(401).send("Unauthorized");
//     }
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         res.send(`Welcome user ${decoded.userId}`);
//     } catch (err) {
//         res.status(401).send("Invalid Token");
//     }
// });

// app.listen(3001, () => {
//     console.log('Server running on http://localhost:3001');
// });
