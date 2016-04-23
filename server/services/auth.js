//var localStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    User = require('../models/user');

var config = require('../../config/server');

module.exports = {
    setup: function(passport) {

        // Serialize user for the session
        passport.serializeUser(function(user, done) {
            done(null, user._id);
        });

        // Deserialize the user
        passport.deserializeUser(function(id, done) {
            User.findById(id, function(err, user) {
                done(err, user);
            });
        });


        // -------------------------------------------------------------------------
        // GOOGLE STRATEGY
        // -------------------------------------------------------------------------

        passport.use('google', new GoogleStrategy(
            // Config
            config.googleOAuth,
            function(token, refreshToken, profile, done) {

                // User.findOne won't fire until we have all our data back from Google
                process.nextTick(function() {

                    // Try to find the user based on their Google id
                    User.findOne({ 'google.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            // If a user is found, log them in
                            return done(null, user);
                        } else {
                            // If the user isn't in our database, create a new user
                            var newUser = new User({
                                google: {
                                    id: profile.id,
                                    token: token
                                },
                                name: profile.displayName,
                                email: profile.emails[0].value // User's first email
                            });

                            // save the user
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                });
            }
        ));
    },

    // Express middleware to validate user authentication on protected routes
    check: function(req, res, next){
        if (req.isAuthenticated()) {
            next();
        } else {
            res.status(401).send();
        }
    }
};
