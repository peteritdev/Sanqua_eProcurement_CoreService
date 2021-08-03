const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/server/config/config.json')[env];

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.json({
  limit: '50mb',
  extended: true,
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

require('./server/routes')(app);
app.get('*', (req, res) => res.status(200).send({
  message: 'Welcome to the beginning of nothingness.',
}));

const http = require('http');
//const app = require('../app'); // The express app we just created

const port = parseInt(process.env.PORT, 10) || (config.appPort);
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

module.exports = app;