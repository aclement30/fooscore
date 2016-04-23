var Player = require('../models/player'),
    requireAuth = require('../services/auth').check;

function init(app) {

    app.get('/api/players', requireAuth, function (req, res) {
        Player.find({isDeleted: false}).exec(function (err, objects) {
            var objectMap = {};

            objects.forEach(function (object) {
                objectMap[object._id] = object;
            });

            res.send(objectMap);
        });
    });
}

module.exports.init = init;