//var localStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    User = require('../models/user'),
    Group = require('../models/group');

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
                    User.findOne({ 'google.id' : profile.id }, function(error, user) {
                        if (error) {
                            return done('oauth-error');
                        }

                        if (user) {
                            // If a user is found, log them in
                            return done(null, user);
                        } else {
                            Group.findOne({ 'alias': config.defaultGroup }, function (err, group) {
                                if (err || !group) {
                                    return done('unknown-group-error');
                                }

                                var validateEmailDomain = function(email, domain) {
                                    domain = domain.replace('.', '\\.');
                                    var regex = new RegExp('^\\"?[\\w-_\\.]*\\"?@' + domain + '$', 'i');

                                    return regex.test(email);
                                };

                                var email = profile.emails[0].value; // User's first email

                                var validated = false;
                                group.emailDomains.forEach(function(domain){
                                    if (validateEmailDomain(email, domain)) {
                                        validated = true;
                                    }
                                });

                                if (validated) {
                                    // If the user isn't in our database, create a new user
                                    var newUser = new User({
                                        google: {
                                            id: profile.id,
                                            token: token
                                        },
                                        name: profile.displayName,
                                        email: email
                                    });

                                    // save the user
                                    newUser.save(function (err) {
                                        if (err)
                                            throw err;
                                        return done(null, newUser);
                                    });
                                } else {
                                    done("unauthorized-email-domain");
                                }
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
