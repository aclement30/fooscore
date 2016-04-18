'use strict';

describe('PlayerService', function() {
    beforeEach(module('scoreApp'));

    var playerService;

    beforeEach(inject(function($injector){
        playerService = $injector.get('Player');
    }));

    it("list player names", function () {
        var names = playerService.names;

        expect(names.length).toBeGreaterThan(1);
        expect(names[0]).toEqual('Alexandre');
    });

    it("list player colors", function () {
        var names = playerService.names;
        var colors = playerService.colors;

        expect(colors['Alexandre']).toBeDefined();
        expect(colors['Alexandre']).toEqual('#304ffe');

        expect(Object.keys(colors)).toEqual(names);
    });
});
