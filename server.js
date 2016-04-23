// -------------------------------------------------------------------------
// DEPENDENCIES
// -------------------------------------------------------------------------

var express = require('express'),
    http = require('http'),
    mongoose = require('mongoose'),
    bodyParser = require("body-parser"),
    passport = require('passport'),
    expressSession = require('express-session');

// -------------------------------------------------------------------------
// CONFIG
// -------------------------------------------------------------------------

var config = require('./config/server');

// -------------------------------------------------------------------------
// CONTROLLERS
// -------------------------------------------------------------------------

var authController = require('./server/controllers/authController'),
    configController = require('./server/controllers/configController'),
    matchController = require('./server/controllers/matchController'),
    playerController = require('./server/controllers/playerController'),
    statsController = require('./server/controllers/statsController');

// -------------------------------------------------------------------------
// SERVICES
// -------------------------------------------------------------------------

var AuthService = require('./server/services/auth');

// -------------------------------------------------------------------------
// DB SETUP
// -------------------------------------------------------------------------

mongoose.connect(config.db);

// -------------------------------------------------------------------------
// EXPRESS SETUP
// -------------------------------------------------------------------------

// Create an express instance and set a port variable
var app = express();
var port = config.express.port;

// Configure session & Passport auth
app.use(expressSession({
    secret: config.sessionSecretKey,
    name: 'fooscore',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Setup Passport for authentication
AuthService.setup(passport);

// Disable etag headers on responses
app.disable('etag');

// Set /public as our static content dir
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({'extended': 'true'}));           // parse application/x-www-form-urlencoded
app.use(bodyParser.json());

// -------------------------------------------------------------------------
// EXPRESS ROUTING
// -------------------------------------------------------------------------

app.get('/', function(req, res) {
    res.sendFile('public/index.html', {root: __dirname});
});

authController.init(app, passport);
configController.init(app);
matchController.init(app);
playerController.init(app);
statsController.init(app);

// -------------------------------------------------------------------------

// Fire it up (start our server)
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});