var User = require('../../server/models/user'),
    extend = require('extend');

describe("User", function() {

    var defaultData = {
        name: 'User name',
        email: 'test',
        google: {
            id: 'google-id',
            token: 'google-token'
        }
    };

    it("requires name", function () {
        var userData = extend(true, {}, defaultData);
        delete userData.name;

        var user = new User(userData);
        var error = user.validateSync();

        expect(error.errors['name'].kind).toBe('required');
    });

    it("requires email", function () {
        var userData = extend(true, {}, defaultData);
        delete userData.email;

        var user = new User(userData);
        var error = user.validateSync();

        expect(error.errors['email'].kind).toBe('required');
    });

    it("data is valid", function () {
        var user = new User(defaultData);

        var error = user.validateSync();

        expect(error).toEqual(undefined);
    });
});