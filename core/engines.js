/* jshint esversion:6 */

/*
	Loads the engines into the context
*/

const fs = require('fs');
const path = require('path');

module.exports = (context) => {
	context.logger.title('Engines');
	var engines = {};
	var enginesEnabled = [];
	var enginesPromises = [];

	try {
		enginesEnabled = fs.readdirSync(path.join(context.enginesPath));
	} catch (err) {
		context.logger.error('Unable to load engines. Dir ' + context.enginesPath + ' not found');
		throw err;
	}

	for (let i = 0; i < enginesEnabled.length; i++) {
		enginesPromises.push(new Promise((resolveEngine, rejectEngine) => {
			var filename = path.join(context.enginesPath, enginesEnabled[i]);
			if (filename.slice(-3) == '.js') {
				try {
					var engine = require(filename);
					engines[engine.name] = engine;
					context.logger.info(enginesEnabled[i] + ' sucessfully loaded');
					resolveEngine();
				} catch (err) {
					context.logger.warning('Unable to load ' + enginesEnabled[i]);
					context.logger.info('Ignoring');
					rejectEngine();
				}
			} else {
				context.logger.warning('Unable to load ' + enginesEnabled[i] + ' : file is not javascript');
				context.logger.info('Ignoring');
				rejectEngine();
			}

		}));
	}
	Promise.all(enginesPromises).then(() => {}).catch(() => {
		context.logger.warning('Engines did not load correctly');
	});
	context.engines = engines;
	context.logger.done();
};