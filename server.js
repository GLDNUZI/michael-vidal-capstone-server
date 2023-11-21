import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';

dotenv.config();

const app = express();

// Session configuration
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret and ideally store it in .env
    resave: true,
    saveUninitialized: true
}));

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/oauth2callback"
},
    function (accessToken, refreshToken, profile, cb) {
        // Here you can save the profile information to your user database if needed
        return cb(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube'] }));

app.get('/oauth2callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        console.log('Google user profile:', req.user);
        // Successful authentication, redirect home or to another page.
        res.redirect('/');
    });
app.get('/', function (req, res) {
    res.send('Welcome to the application!');
});


// Add other routes as needed

// Start the server
app.listen(3001, () => {
    console.log('Server started on http://localhost:3001');
});
