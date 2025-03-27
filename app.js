const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const cors = require('cors');
const _ = require('lodash');

// Set up the express app
const app = express();

//Log requests to the console
app.use(logger('dev'));

// parse incoming requests data
app.use(
	bodyParser.json({
		limit: '50mb'
	})
);
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Setup a default catch-all route that sends back a welcome message in JSON format.
require('./server/routes')(app);

app.get('*', (req, res) =>
	res.status(200).send({
		message: 'Welcome to the beginning of nothingness.'
	})
);

module.exports = app;
