let FacebookStrategy = require('passport-facebook').Strategy;
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let JwtStrategy = require('passport-jwt').Strategy;
let ExtractJwt = require('passport-jwt').ExtractJwt;
let LocalStrategy = require('passport-local').Strategy;
let InstagramStrategy = require('../passport/InstagramStrategy');
let User = require('../model/User');
const conf = require('./Properties').getProperties();
let facebookLog = require('log4js').getLogger('FacebookLogin');
let googleLog = require('log4js').getLogger('GoogleLogin');
let instagramLog = require('log4js').getLogger('IntagramLogin');
let localLog = require('log4js').getLogger('LocalLogin');
let jwtLog = require('log4js').getLogger('JWTAuth');

module.exports = function (passport) {

    let JWTExtractor = (req) => {
        let token = null;
        if (req && req.header(conf.loginToken.headerName)) {
            token = req.header(conf.loginToken.headerName);
        }

        return token;
    };

    const facebookOptions = {
        clientID: conf.facebook.clientId,
        clientSecret: conf.facebook.clientSecret,
        callbackURL: conf.facebook.callbackURL,
        enableProof: true,
        profileFields: ['picture.type(large)', 'displayName', 'emails']
    };

    const instagramOptions = {
        clientID: conf.instagram.clientId,
        clientSecret: conf.instagram.clientSecret,
        callbackURL: conf.instagram.callbackURL,
        passReqToCallback: true,
    };


    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromExtractors([JWTExtractor]),
        secretOrKey: conf.loginToken.secret
    };

    const googleOptions = {
        clientID: conf.google.clientId,
        clientSecret: conf.google.clientSecret,
        callbackURL: conf.google.callbackURL
    };

    const localOptions = {
        usernameField: 'email',
        passwordField: 'password'
    };

    passport.use(
        new FacebookStrategy(facebookOptions, async (req, accessToken, refreshToken, profile, done) => {
                facebookLog.info("Accessing to facebook auth with profileId :" + profile.id);
                let user = await User.findOne({providerId: profile.id, providerName: 'facebook'});
                if (!user) {
                    user = new User();
                    user.providerId = profile.id;
                    user.providerName = 'facebook';
                    user.profilePic = profile.photos[0].value;
                    user.displayName = profile.displayName;
                    user.email = profile.emails[0].value;
                }

                facebookLog.info("Saving facebook user " + profile.id);
                let savedUser = await user.save();
                done(null, savedUser._doc);
            }
        )
    );

    passport.use(
        new InstagramStrategy(instagramOptions, async (accessToken, refreshToken, unused, profile, done) => {
                instagramLog.info("Accessing to instagram auth with profileId :" + profile.id);
                let user = await User.findOne({providerId: profile.id, providerName: 'instagram'});
                if (!user) {
                    user = new User();
                    user.providerId = profile.id;
                    user.providerName = 'instagram';
                }

                instagramLog.info("Saving instagram user " + profile.id);
                user.displayName = profile.displayName;
                user.fullName = profile.fullName;
                user.profilePic = profile.profilePic;
                let savedUser = await user.save();
                done(null, savedUser._doc);
            }
        )
    );

    passport.use(new GoogleStrategy(googleOptions, async (request, accessToken, refreshToken, profile, done) => {
                googleLog.info("Accessing to google auth with profileId :" + profile.id);
                let user = await User.findOne({providerId: profile.id, providerName: 'google'});
                if (!user) {
                    googleLog.info("New google user " + profile.id);
                    user = new User();
                    user.providerId = profile.id;
                    user.providerName = 'google';
                }

                googleLog.info("Saving google user " + profile.id);
                user.email = profile.emails[0].value;
                user.displayName = profile.displayName;
                user.profilePic = profile.photos[0].value;
                let savedUser = await user.save();
                done(null, savedUser._doc);
            }
        ));

    passport.use('jwt', new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
        try {
            let user = await User.findOne({_id: jwtPayload.id,});
            if (user) {
                jwtLog.info("Valid token with User._id : " + jwtPayload.id);
                done(null, user);
            } else {
                jwtLog.error("Unexpected error while processing token: <" + JSON.stringify(jwtPayload) + ">");
                done(null, false);
            }
        } catch (err) {
            jwtLog.error("Invalid token : " + JSON.stringify(jwtPayload));
            return done(err, false);
        }
    }));


    passport.use(new LocalStrategy(localOptions, async (username, password, done) => {
            try {
                let user = await User.findOne({email: username, providerName: 'local'});
                if (!user || !user.verifyPassword(password)) {
                    localLog.error("The user with email " + username + " introduced an invalid password");
                    return done(null, false);
                }

                localLog.info("Login successful for user" + username);
                return done(null, user);
            } catch (err) {
                localLog.error("User not found: " + username);
                return done(err);
            }
        }
    ));

};
