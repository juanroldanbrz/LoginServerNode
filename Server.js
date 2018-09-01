let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let passport = require('passport');
let mongoose = require('mongoose');
let logger = require('morgan');
const path = require('path');
const debug = require('debug')('login-api');
const npid = require('npid');
const fs = require('fs-extra');
let log4js = require('log4js');
const fileUpload = require('express-fileupload');

const propertiesService = require('./config/Properties');

let logConfig = {
    appenders: {
        out: { type: 'stdout' },
        app: { type: 'file', filename: 'application.log' }
    },
    categories: {
        default: { appenders: [ 'out', 'app' ], level: 'info' }
    }
};

log4js.configure(logConfig);
let log = log4js.getLogger('Server');


const profile = process.env.PROFILE;

if(profile === undefined){
    log.info('Loaded default profile');

    propertiesService.setProperties(path.join(__dirname, 'properties.yml'));
} else {
    log.info("Loaded", profile, 'profile');
    propertiesService.setProperties(path.join(__dirname, 'properties-' + profile +'.yml'));
}

const conf = propertiesService.getProperties();
const awsService = require('./service/AmazonS3');

awsService.initS3();

require('./config/Passport')(passport);

let port = conf.server.port || 80;

app.use(logger('dev'));
mongoose.set('debug', true);

app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authentication");
    next();
});

mongoLogger = log4js.getLogger('MongoDB');
serverLogger = log4js.getLogger('Server');

mongoose.connect(conf.mongo.uri).then(
		() => {
				mongoLogger.info('Connected to to mongo');
				},
		err => {
				mongoLogger.error(err); }
);

try {
	let serverPidPath = 'server.pid';
	if(fs.existsSync(serverPidPath)){
		fs.removeSync(serverPidPath);
	}
    const pid = npid.create(serverPidPath);
    pid.removeOnExit();
    serverLogger.info("PID Created on server.pid")
} catch (err) {
    console.log(err);
    process.exit(1);
}

let authRoutes = require('./route/AuthRoute');
let userRoutes = require('./route/UsersRoute');
let healthCheckRoute = require('./route/HealthCheckRoute');

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/healthcheck', healthCheckRoute);

app.listen(conf.server.port, conf.server.interface);
log.info('Listening on port ' + port);