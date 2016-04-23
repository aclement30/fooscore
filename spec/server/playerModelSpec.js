var Player = require('../../server/models/player'),
    extend = require('extend');

describe("Player", function() {

    var defaultData = {
        alias: 'player-alias',
        name: 'Player name'
    };

    it("requires alias", function () {
        var playerData = extend(true, {}, defaultData);
        delete playerData.alias;

        var player = new Player(playerData);
        var error = player.validateSync();

        expect(error.errors['alias'].kind).toBe('required');
    });

    it("requires name", function () {
        var playerData = extend(true, {}, defaultData);
        delete playerData.name;

        var player = new Player(playerData);
        var error = player.validateSync();

        expect(error.errors['name'].kind).toBe('required');
    });

    it("data is valid", function () {
        var player = new Player(defaultData);

        var error = player.validateSync();

        expect(error).toEqual(undefined);
    });
});