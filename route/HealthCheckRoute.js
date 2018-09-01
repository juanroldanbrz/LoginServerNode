let express = require('express');
let router = express.Router();
let log = require('log4js').getLogger('AuthRoute');

router.get('/', function(req, res, next) {
    log.info("Im alive!");
    res.send("OK");
});

module.exports = router;