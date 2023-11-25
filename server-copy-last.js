const dotenv = require('dotenv');
const express = require('express');
// const knex = require('knex'); // Uncomment this line if you're using knex
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors')
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client();
const helmet = require('helmet');
const config = './knexfile.js';
const http = require('https');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
// Add http headers, small layer of security
const KnexSessionStore = require('connect-session-knex')(session);
const HMS = require("@100mslive/server-sdk");


dotenv.config();
const knex = require('knex')(require('./knexfile.js'));

const hmsClient = new HMS.SDK(process.env.ACCESS_KEY, process.env.ACCESS_SECRET);


const app = express();


// Initialize HTTP Headers middleware
app.use(helmet());

app.use(express.json())
// Enable CORS (with additional config options required for cookies)
app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
    })
);
const store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions',
    config: config,
    sidfieldname: 'sid',
    knex: knex,
    clearInterval: 30 * 1000,
});


// Session configuration
app.use(session({
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: 'auto', // Secure cookies, use 'true' for HTTPS
        maxAge: 30 * 1000
    }
}));

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


// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/oauth2callback"
}, function (accessToken, refreshToken, profile, cb) {
    console.log("accessToken ", accessToken, refreshToken, profile, cb);
    knex('users')
        .select('id')
        .where({ google_id: profile.id })
        .then((user) => {
            if (user.length) {
                // If user is found, pass the user object to serialize function
                cb(null, user[0]);
            } else {
                // If user isn't found, we create a record
                console.log("insert");
                knex('users')
                    .insert({
                        username: profile._json.name
                        , google_id: profile.id,
                        avatar_url: profile._json.picture,
                    })
                    .then((userId) => {
                        console.log("insert user id ", userId);
                        // Pass the user object to serialize function
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
}
));


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
// ,  "type": "module"
app.get('/createRoom', async (req, res) => {
    // creating a room -
    // const room = await hmsClient.rooms.create();
    const name = "michaeldemo2";
    const roomCreateOptions = {
        'name': name,
        "description": 'testing',
        'template_id': '655ab832c75a69c5f8103515',
        // 'recording_info': false,
        // 'region': 'US'
    };
    const roomWithOptions = await hmsClient.rooms.create(roomCreateOptions);

    console.log('roomWithOptions', roomWithOptions);
    res.status(200).json(roomWithOptions);
})

app.get('/getrooms2', async (req, res) => {

    const roomWithOptions = hmsClient.rooms.list();

    console.log('roomWithOptions', roomWithOptions);
    for await (const session of roomWithOptions) {
        // console.log(session);
        if (!roomWithOptions.isNextCached) {
            console.log("the next loop is gonna take some time");
        }
    }
    res.status(200).json(roomWithOptions);
});


app.get('/getrooms', async (req, res) => {

    // curl --location --request GET 'https://api.100ms.live/v2/live-streams' \
    // --header 'Authorization: Bearer <management_token>'

    const restult = await axios.get('https://api.100ms.live/v2/live-streams', {
        headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDA4Mjg1NjUsImV4cCI6MTcwMDkxNDk2NSwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDA4Mjg1NjUsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.nCnCqJNcbMq1IjJefG1cHeSWQYtOXnVgsj5q15Vp0FY'
        },
        params: {
            room_id: '6560b0d6afd3b2853348d72c'
            // status: 'running',
            // limit: 1
        }
    })
    const data = restult.data.data;
    console.log('result ', ' ==========\n\n', data);
    res.status(200).json(data);
    // const options = {
    //     host: 'api.100ms.live',
    //     path: '/v2/live-streams',
    //     method: 'GET',
    //     headers: {
    //         'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDA4Mjg1NjUsImV4cCI6MTcwMDkxNDk2NSwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDA4Mjg1NjUsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.nCnCqJNcbMq1IjJefG1cHeSWQYtOXnVgsj5q15Vp0FY'
    //     },
    //     query: {
    //         'status': 'running'
    //     }
    // }
    // // console.log(options);

    // http.get(options, result => {

    //     console.log('rooms ', result.statusCode);
    //     let str = '';
    //     result.on('data', d => {
    //         str += d;
    //         // console.log('data is ', d);
    //     })
    //     result.on('end', () => {
    //         // str += d;
    //         console.log('data is ', JSON.parse(str));
    //     })
    //     // result.on('error', e => {
    //     //     console.log('error is ', e);
    //     // })

    // });
    // const peers = await hmsClient.activeRooms.retrieveActivePeers(process.env.REACT_APP_ROOM_ID);
    // console.log(peers);
    // const allSessionsIterable = hmsClient.sessions.list();
    // for await (const session of allSessionsIterable) {
    //     console.log(session);
    //     if (!allSessionsIterable.isNextCached) {
    //         console.log("the next loop is gonna take some time");
    //     }
    // }
});


app.post('/authenticate', async (req, res) => {
    console.log('req.session.user', req.sessionID);
    const result = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.GOOGLE_CLIENT_ID
    })
    console.log('auth ', result.getPayload());
    const payload = result.getPayload()
    console.log(req.session.uid, payload.sub);
    knex('sessions')

    knex('users')
        .select('id')
        .where({ google_id: payload.sub })
        .then((user) => {
            if (user.length) {

                res.status(200).json({ "status": 200 });
                // If user is found, pass the user object to serialize function
             //cb(null, user[0]);
            } else {
                // If user isn't found, we create a record
                console.log("insert");
                knex('users')
                    .insert({
                        username: payload.name
                        , google_id: payload.sub,
                        avatar_url: payload.picture,
                        email: payload.email,
                    })
                    .then((userId) => {
                        console.log("insert user id ", userId);
                        res.status(200).json({ "status": 200 });
                        // Pass the user object to serialize function
                        // cb(null, { id: userId[0] });
                    })
                    .catch((err) => {
                        console.log('Error creating a user', err);
                        res.status(400).json({ "status": 200 });

                    });
            }
        })
        .catch((err) => {
            console.log('Error fetching a user', err);
            res.status(400).json({ "status": 200 });

        });

    // Passport stores authenticated user information on `req.user` object.
    // Comes from done function of `deserializeUser`

    // If `req.user` isn't found send back a 401 Unauthorized response
    // if (req.user === undefined)
    // 	return res.status(401).json({ message: 'Unauthorized' });

    // If user is currently authenticated, send back user info
});

// Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube', 'profile'] }));

app.get('/oauth2callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        console.log('Google user profile:', req.user.id);

        res.redirect('/');
    });
app.get('/', function (req, res) {
    // res.send('Welcome to the application!');
    res.redirect('http://localhost:3000');
});


app.get('/test', function (req, res) {
    console.log(req.sessionID);

    // knex('sessions')
    //     .select('expired')
    //     .where({ sid: req.sessionID })
    //     .then((date) => {
    //         const serverDate = date[0].expired;
    //         console.log(date[0].expired);
    //         const dateCurr = new Date(); // current date
    //         const dateData = new Date(serverDate);
    //         if (dateCurr < dateData) {
    //             // continue with servcer flow, passs data etc
    //         } else {
    //             // user session is exipred, fail the request and redirect 
    //         }
    //         // console.log(dateCurr < dateData);
    //     });
    // console.log('req.session.uid ', req.session.uid);
    // res.send('Welcome to the application!');
    res.status(200).json({ 'msg': 'test', 'cookie': req.cookies });
});

app.listen(3001, () => {
    console.log('Server started on http://localhost:3001');
});



