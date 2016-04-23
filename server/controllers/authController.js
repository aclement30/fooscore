var requireAuth = require('../services/auth').check;

function init(app, passport) {

    // Google OAuth redirection page
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // Callback after Google authenticates user
    app.get('/auth/google/callback', function(req, res, next) {
        passport.authenticate('google', function(error, user, info) {
            if (error) {
                return res.redirect('/?error=' + error + '#/login');
            }

            if (!user) {
                return res.redirect('/#/login');
            }

            req.logIn(user, function(err) {
                if (err) {
                    return res.redirect('/?error=' + err + '#/login');
                }

                return res.redirect('/');
            });

        })(req, res, next);
    });

    // Connected user info page
    app.get('/api/user', requireAuth, function (req, res) {
        if (req.user) {
            res.send({
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            });
        } else {
            res.status(403).send();
        }
    });

    // User logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
}

module.exports.init = init;