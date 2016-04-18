// Require our dependencies
var express = require('express'),
    http = require('http'),
    mongoose = require('mongoose'),
    config = require('./server/config')['dev'],
    matchController = require('./server/controllers/matchController'),
    statsController = require('./server/controllers/statsController'),
    bodyParser = require("body-parser");

// Create an express instance and set a port variable
var app = express();
var port = process.env.PORT || 3000;

// Disable etag headers on responses
app.disable('etag');

// Connect to our mongo database
mongoose.connect(config.db);

// Set /public as our static content dir
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({'extended': 'true'}));           // parse application/x-www-form-urlencoded
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.sendFile('public/index.html', {root: __dirname});
});

matchController.init(app);
statsController.init(app);

// Fire it up (start our server)
app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});