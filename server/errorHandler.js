module.exports.client = function(errorMessage, response, code) {
    if (!code) {
        code = 400;
    }

    response.status(code).send({ error: errorMessage });
};

module.exports.server = function(error, response) {
    console.error(error.stack);
    res.status(500).send({ error: 'Internal server error' });
};