/* jshint esversion:6*/

/*
	Loads enabled services into the context
*/

const fs = require('fs');
const path = require('path');

module.exports = (context) => {
	context.logger.title('Services');
	var services = {};
	var enabled = [];
	var servicePromises = [];

	try {
		enabled = JSON.parse(fs.readFileSync(path.join(context.servicesPath, 'services.json'))).enabled;
	} catch (err) {
		context.logger.error('Unable to load enabled services. File not found');
		throw err;
	}

	for (let i = 0; i < enabled.length; i++) {
		servicePromises.push(new Promise((resolveService, rejectService) => {
			try {
				services[enabled[i]] = require(path.join(context.servicesPath, enabled[i]))(context);
				context.logger.info(enabled[i] + ' sucessfully loaded');
				resolveService();
			} catch (err) {
				if (err.code) {
					context.logger.warning('Unable to load ' + enabled[i] + ' : file does not exists');
					context.logger.info('Ignoring');
				} else {
					context.logger.warning('Unable to load ' + enabled[i] + ' : file not correct');
					console.log(err);
					context.logger.info('Ignoring');
				}
				rejectService();
			}
		}));
	}
	Promise.all(servicePromises).then(() => {}).catch(() => {
		context.logger.warning('Services did not load correctly');
	});
	context.services = services;
	context.logger.done();
};