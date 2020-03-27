/* jshint esversion:6*/


/*
    Loads enabled modules into the context
    Sets routes according to configuration files
*/

const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

module.exports = (context, app) => {
	context.logger.title('Modules');

	context.menu = [];
	context.header = [];
	context.enabledRoutesObject = {};
	context.enabledRoutesArray = [];

	var enabled = [];
	var modulePromises = [];

	try {
		enabled = JSON.parse(fs.readFileSync(path.join(context.modulesPath, 'modules.json'))).enabled;
	} catch (err) {
		context.logger.error('Unable to load enabled modules. File not found');
		throw err;
	}

	const allowIncludes = (includes, authorisation, moduleName) => {
		const allowType = (array) => {
			for (let i = 0; i < array.length; i++) {
				const include = array[i];
				const filename = path.join(context.modulesPath, moduleName, include.file);
				if (fs.existsSync(filename)) {
					app.get([include.route, include.route + '/*', include.route + '*'], context.bouncer('user'), context.bouncer('module')(authorisation), (req, res) => {
						res.sendFile(include.file, {
							root: path.join(context.modulesPath, moduleName)
						});
					});
				} else {
					context.logger.warning('Error while loading module ' + moduleName + ': file ' + filename + ' does not exist');
				}
			}
		};
		const assets = ['scripts', 'styles', 'misc'];
		for (let i = 0; i < assets.length; i++) {
			if (includes.hasOwnProperty(assets[i])) {
				allowType(includes[assets[i]]);
			}
		}
	};
	const loadStatic = (route, moduleName, rule, moduleController = '') => {
		allowIncludes(rule.includes, rule.authorisation, moduleName);
		app.get(context.services.caster.castRoute('includesRule', rule.viewport.location, moduleName), context.bouncer('user'), context.bouncer('module')(rule.authorisation), (req, res) => {
			res.json(rule.includes);
		});

		app.get(route, context.bouncer('user'), context.bouncer('module')(rule.authorisation), (req, res) => {
			res.sendFile(rule.call.location, {
				root: path.join(context.modulesPath, moduleName)
			});
		});
	};

	const loadCallback = (route, moduleName, rule, moduleController) => {
		try {
			allowIncludes(rule.includes, rule.authorisation, moduleName);
			app.get(context.services.caster.castRoute('includesRule', rule.viewport.location, moduleName), context.bouncer('user'), context.bouncer('module')(rule.authorisation), (req, res) => {
				res.json(rule.includes);
			});

			if (rule.viewport.method == 'post') {
				if (rule.viewport.enctype != 'multipart') {
					app.post(route, context.bouncer('user'), context.bouncer('module')(rule.authorisation), bodyParser[rule.viewport.enctype](rule.viewport.options), moduleController[rule.call.location]);
				} else {
					var diskStorage = {
						storage: multer.diskStorage({
							destination: function (req, file, next) {
								next(null, context.userUploadsPath);
							},

							filename: function (req, file, next) {
								var ext = file.mimetype.split('/')[1];
								next(null, moduleName + '_' + Date.now() + '_' + file.fieldname + '.' + ext);
							}
						})
					};
					var field = rule.viewport.options.field;
					app.post(route, context.bouncer('user'), context.bouncer('module')(rule.authorisation), multer(diskStorage).single(field), moduleController[rule.call.location]);
				}
			} else {
				app[rule.viewport.method](route, context.bouncer('user'), context.bouncer('module')(rule.authorisation), moduleController[rule.call.location]);
			}
		} catch (loadCallbackError) {
			context.logger.warning('Callback \'' + rule.call.location + '\' of module \'' + moduleName + '\' not found or contains errors, ignoring rule');
			throw loadCallbackError;
		}
	};

	const loadMiddleware = (route, moduleName, rule, moduleController) => {
		try {
			app.use(route, context.bouncer('user'), context.bouncer('module')(rule.authorisation), moduleController[rule.call.location]);
		} catch (loadMiddlewareError) {
			context.logger.warning('Middleware \'' + rule.call.location + '\' of module \'' + moduleName + '\' not found or contains errors, ignoring rule');
		}
	};

	const loadModule = (moduleName) => {
		if (!fs.existsSync(path.join(context.modulesPath, moduleName))) {
			throw 'Module directory does not exist';
		}

		var moduleConfigRaw = {};
		var moduleController = '';
		var moduleConfig;

		// loading configuration files
		try {
			moduleConfigRaw = JSON.parse(fs.readFileSync(path.join(context.modulesPath, moduleName, 'config.json')));
			moduleController = require(path.join(context.modulesPath, moduleName, 'controller.js'));
		} catch (error) {
			throw 'Module configuration failed : either config.json or controller.js does not exist';
		}

		// casting configuration
		try {
			moduleConfig = context.services.caster.castModuleConfig(moduleName, moduleConfigRaw);
		} catch (errorCastModuleConfig) {
			throw errorCastModuleConfig;
		}

		// can now load module
		if (moduleConfig) {
			// tables, header, menu, routes (contact, includes, rules)

			// creating tables
			for (let i = 0; i < moduleConfig.tables.length; i++) {
				context.database.create(moduleConfig.tables[i]);
			}

			// adding to header
			for (let i = 0; i < moduleConfig.header.length; i++) {
				let headerItem = moduleConfig.header[i];
				headerItem.moduleName = moduleName;
				headerItem.beta = moduleConfig.beta;
				headerItem.description = moduleConfig.description;
				context.header.push(headerItem);
			}

			// adding to menu
			for (let i = 0; i < moduleConfig.menu.length; i++) {
				let menuItem = moduleConfig.menu[i];
				menuItem.moduleName = moduleName;
				menuItem.beta = moduleConfig.beta;
				menuItem.description = moduleConfig.description;
				context.menu.push(menuItem);
			}

			// enabling route to contact
			app.get(context.services.caster.castRoute('contact', '', moduleName), context.bouncer('user'), context.bouncer('module')(moduleConfig.authorisation), (req, res) => {
				res.json(moduleConfig.contact);
			});

			// allowing for includes
			allowIncludes(moduleConfig.includes, moduleConfig.authorisation, moduleName);
			app.get(context.services.caster.castRoute('includesModule', '', moduleName), context.bouncer('user'), context.bouncer('module')(moduleConfig.authorisation), (req, res) => {
				res.json(moduleConfig.includes);
			});

			// handling rules
			const loader = {
				static: loadStatic,
				callback: loadCallback,
				middleware: loadMiddleware
			};
			for (let i = 0; i < moduleConfig.rules.length; i++) {
				try {
					const route = context.services.caster.castRoute(moduleConfig.rules[i].viewport.type, moduleConfig.rules[i].viewport.location, moduleName);
					if (moduleConfig.rules[i].viewport.type == 'external' && context.enabledRoutesArray.indexOf(route) > -1) {
						context.logger.warning('The external route ' + route + ' is defined several times');
					}
					context.enabledRoutesObject[moduleName].push(route);
					context.enabledRoutesArray.push(route);
					loader[moduleConfig.rules[i].call.type](route, moduleName, moduleConfig.rules[i], moduleController);
				} catch (loadResourceError) {
					throw loadResourceError;
				}
			}
		}

	};


	for (let i = 0; i < enabled.length; i++) {
		modulePromises.push(new Promise((resolveModule, rejectModule) => {
			try {
				context.enabledRoutesObject[enabled[i]] = [];
				loadModule(enabled[i], context, app);
				resolveModule();
			} catch (errorLoadModule) {
				context.logger.warning('Failed to load module ' + enabled[i]);
				console.log(errorLoadModule);
				rejectModule();
			}
		}));
	}
	Promise.all(modulePromises).then(() => {}).catch(() => {
		context.logger.warning('Modules did not load correctly');
	});
	context.logger.done();
};