var mongoose = require('mongoose'),
    config = require('./config/server'),
    Group = require('./server/models/group'),
    slug = require('slug'),
    YAML = require('yamljs');

// Load local group config file
var groupConfig = YAML.load('.group.config.yml');

// -------------------------------------------------------------------------
// DB SETUP
// -------------------------------------------------------------------------

// Connect to Mongo database
mongoose.connect(config.db);

// -------------------------------------------------------------------------

var alias = groupConfig.alias || slug(groupConfig.name).toLowerCase();

var saveCallback = function(err) {
    if (!err) {
        console.log('Group ' + groupConfig.name + ' has been configured in database');
    } else {
        console.log('Configuration error: ', err);
    }

    process.exit();
};

Group.findOne({ 'alias': alias }).exec(function (err, existingGroup) {
    if (err) {
        console.log('Configuration error: ', err);
    }

    if (existingGroup) {
        existingGroup.name = groupConfig.name;
        existingGroup.emailDomains = groupConfig.emailDomains;

        existingGroup.update(saveCallback);
    } else {
        var group = new Group({
            alias: alias,
            name: groupConfig.name,
            emailDomains: groupConfig.emailDomains
        });

        group.save(saveCallback);
    }
});