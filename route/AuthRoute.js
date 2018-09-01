let router = require('express').Router();
let passport = require('passport');
let jwt = require('jwt-simple');
let User = require('../model/User');
const conf = require('../config/Properties').getProperties();
const path = require('path');
let log = require('log4js').getLogger('AuthRoute');

function processToken(tokenProvider) {
    return function (req, res) {
        let userId = req.user._id;
        if (userId) {
            let redirectUrl = conf.loginToken.redirectUrl;
            let JWTToken = createJWTToken(userId, tokenProvider);
            log.info("Created new JWT TOKEN for user : " + userId + " <" + JWTToken + ">");
            log.info("Redirecting to token handling url : " + redirectUrl);
            res.redirect(redirectUrl + "?token=" + JWTToken);

            // TODO ONLY IN TEST
            //res.json({ jwt: JWTToken, userInfo: req.user})
        } else {
            res.sendStatus(401);
        }
    }
}

let createJWTToken = (userID, provider) => {
    let payload = {
        id: userID,
        providerName: provider,

    };

    return jwt.encode(payload, conf.loginToken.secret);
};

router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json(req.user);
});

router.get('/facebook', passport.authenticate('facebook', {session: false, scope: ['public_profile', 'email']}), processToken('facebook'));

router.get("/facebook/callback",
    passport.authenticate('facebook', {session: false, failureRedirect: '/'}), processToken('facebook')
);

router.get('/instagram', passport.authenticate('instagram', {session: false, failureRedirect: '/'}), processToken('instagram'));

router.get("/instagram/callback", passport.authenticate('instagram', {session: false, failureRedirect: '/'}), processToken('instagram'));

router.get('/google',
    passport.authenticate('google', {session: false, scope: ['profile', 'email']}, processToken('google'))
);

router.get("/google/callback",
    passport.authenticate('google', {session: false, failureRedirect: '/'}), processToken('google')
);

router.post('/local',
    passport.authenticate('local', {session: false}), processToken('local')
);

router.post('/register', async (req, res) => {
    let email = req.body.email;
    let result = await User.findOne({email: email});
    if (result) {
        log.warn("Trying to register a new user with already used email :" + email);
        res.sendStatus(409);
    } else {
        let newUser = new User({email: req.body.email, displayName: req.body.displayName,});
        newUser.password = newUser.generateHash(req.body.password);
        try {
            let newUser = await newUser.save();
            log.info("New user created OK. Email :" + email);
            res.sendStatus(200);
        } catch (err) {
            log.error("Error creating new user with email: " + email);
            res.sendStatus(400);
        }
    }
});

module.exports = router;
