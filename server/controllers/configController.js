var config = require('../../config/server'),
    Group = require('../models/group');

function init(app) {

    // Config page
    app.get('/api/config', function (req, res) {
        Group.findOne({ 'alias': config.defaultGroup }, function (err, group) {
            if (err || !group) {
                errorHandler.client("Group not found (" + config.defaultGroup + ')', res);

                return;
            }

            res.send({
                group: {
                    name: group.name
                }
            });
        });
    });
}

module.exports.init = init;