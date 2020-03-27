/* jshint esversion:6 */

/*
    Loads the configuration file filename into the context and adds some paths
*/

const fs = require('fs');
const path = require('path');

module.exports = (filename, context) => {
	context.logger.title('Context');
	var config = {};

	try {
		config = JSON.parse(fs.readFileSync(filename));
	} catch (err) {
		context.logger.error('Unable to load configuration file ' + filename);
		throw err;
	}

	for (let i in config) {
		if (config.hasOwnProperty(i)) context[i] = config[i];
	}

	context.webPath = path.join(context.rootPath, '/web');
	context.commonsPath = path.join(context.rootPath, '/web/commons');
	context.publicPath = path.join(context.rootPath, '/web/public');
	context.privatePath = path.join(context.rootPath, '/web/private');
	context.userUploadsPath = path.join(context.rootPath, '/web/uploads');

	context.enginesPath = path.join(context.rootPath, '/engines');
	context.modulesPath = path.join(context.rootPath, '/modules');
	context.servicesPath = path.join(context.rootPath, '/services');
	context.logger.done();
};