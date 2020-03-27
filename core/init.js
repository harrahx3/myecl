/* jshint esversion:6 */

/*
    Initialises the application and loads routes
*/

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

module.exports.launch = (context) => {
	// building app and adding basic utilities

	var app = express();
	app.use(helmet());
	app.use(cookieParser());
	app.use('/*', (req, res, next) => {
		req.logger = context.logger;
		req.crypter = context.crypter;
		req.engines = context.engines;
		req.database = context.database;
		req.services = context.services;
		req.user_upload = context.userUploadsPath;

		next();
	});

	// handling routes
	require('./router')(context, app);

	// starting server
	app.listen(context.port, context.url, () => {
		context.logger.info('Listening ' + context.url + ' on port ' + context.port.toString());
	});

	// handling process exit
	process.on('uncaughtException', (exception) => {
		context.logger.error('Uncaught exception');
		console.log(exception);
		process.exit();
	});

	process.on('SIGINT', () => {
		context.logger.info('SIGINT received, exiting');
		process.exit();
	});
};