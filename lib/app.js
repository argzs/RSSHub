const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', () => __dirname);

require('./utils/request-wrapper');

const Koa = require('koa');
const AV = require('leanengine');

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});


const logger = require('./utils/logger');

const onerror = require('./middleware/onerror');
const header = require('./middleware/header');
const utf8 = require('./middleware/utf8');
const cache = require('./middleware/cache');
const parameter = require('./middleware/parameter');
const template = require('./middleware/template');
const favicon = require('koa-favicon');
const debug = require('./middleware/debug');
const accessControl = require('./middleware/access-control');

const router = require('./router');
const protected_router = require('./protected_router');
const mount = require('koa-mount');

// API related
const apiTemplate = require('./middleware/api-template');
const api_router = require('./api_router');
const apiResponseHandler = require('./middleware/api-response-handler');

process.on('uncaughtException', (e) => {
    logger.error('uncaughtException: ' + e);
});

const app = new Koa();
app.use(AV.koa());
app.listen(process.env.LEANCLOUD_APP_PORT);
app.proxy = true;

// favicon
app.use(favicon(__dirname + '/favicon.png'));

// global error handing
app.use(onerror);

// 1 set header
app.use(header);

app.use(accessControl);

// 6 debug
app.context.debug = {
    hitCache: 0,
    request: 0,
    paths: [],
    routes: [],
    ips: [],
    errorPaths: [],
    errorRoutes: [],
};
app.use(debug);

// 5 fix incorrect `utf-8` characters
app.use(utf8);

app.use(apiTemplate);
app.use(apiResponseHandler());

// 4 generate body
app.use(template);
// 3 filter content
app.use(parameter);

// 2 cache
app.use(cache(app));

// router
app.use(mount('/', router.routes())).use(router.allowedMethods());

// routes the require authentication
app.use(mount('/protected', protected_router.routes())).use(protected_router.allowedMethods());

// API router
app.use(mount('/api', api_router.routes())).use(api_router.allowedMethods());

module.exports = app;
