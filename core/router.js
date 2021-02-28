/* jshint esversion:6 */

/*
	Builds basic routes, calls specific routes externally
*/
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const findRoute = (route, moduleName, routes) => {
	var found = false;
	if (routes.hasOwnProperty(moduleName)) {
		if (routes.moduleName && routes.moduleName.length) {
			let i = 0;
			const splitRoute = route.split('/');
			while (i < routes[moduleName].length && !found) {
				const splitCompare = routes[moduleName][i].split('/');
				if (splitRoute.length == splitCompare.length) {
					let j = 0;
					let match = true;
					while (j < splitRoute.length && match) {
						if (splitCompare[j][0] == ':' || splitCompare[j][0] != ':' && splitCompare[j] == splitRoute[j]) {
							j++;
						} else {
							match = false;
						}
					}
					found = match;
				}
				i++;
			}
		} else {
			found = true;
		}
	} else if (!route.length || route.slice(0, 9) == '/uploads/') {
		found = true;
	}
	return found;
};

module.exports = (context, app) => {
	const signupController = require('./controllers/signup')(context);
	const signinoutController = require('./controllers/signinout')(context);

	// assets
	app.get(['/home/*', '/signin/*', '/signup/*'], context.bouncer('visitor'), (req, res) => {
		res.sendFile(req.url, {
			root: context.publicPath
		}, (error) => {
			if (error) {
				res.redirect('/404');
			}
		});
	});
	app.get('/commons/*', context.bouncer('all'), (req, res) => {
		res.sendFile(req.url, {
			root: context.webPath
		}, (error) => {
			if (error) {
				context.logger.warning(req.url);
				res.redirect('/404');
			}
		});
	});
	app.get('/uploads/*', context.bouncer('all'), (req, res) => {
		res.sendFile(req.url.slice(9), {
			root: context.userUploadsPath
		}, (error) => {
			if (error) {
				context.logger.warning(req.url);
				res.redirect('/404');
			}
		});
	});

	// setting home
	app.get('/', context.bouncer('visitor'), (req, res) => {
		res.redirect('/home');
	});
	app.get('/home', context.bouncer('visitor'), (req, res) => {
		res.sendFile('/home/index.html', {
			root: context.publicPath
		});
	});

	app.get(['/site.webmanifest'], context.bouncer('visitor'), (req, res) => {
		res.sendFile(req.url, {
			root: context.privatePath
		}, (error) => {
			if (error) {
				console.log(error);
				res.redirect('/forbidden');
			}
		});
	});

	// sync icalendar
	app.get(['/ical'], context.bouncer('visitor'), (req, res) => {
		console.log(req);
		console.log(req.database);

		var calendar = "BEGIN:VCALENDAR\n";
		calendar += "VERSION:2.0\n";
		calendar += "PRODID:myecl\n";
		calendar += "X-PUBLISHED-TTL:P1W\n";

		req.database.query("SELECT id, title, description, location, DATE_FORMAT(start, '%Y%m%eT%k%i%sZ') as start, DATE_FORMAT(end, '%Y%m%eT%k%i%sZ') as end FROM BDECalendar;", [], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				for (var i = 0; i < result.length; i++) {
					console.log(result[i].title);
					calendar += "BEGIN:VEVENT\n";
					calendar += "UID:" + result[i].id + "\n";
					calendar += "DTSTART:" + result[i].start + "\n";
					calendar += "SEQUENCE:0\n";
					calendar += "TRANSP:OPAQUE\n";
					calendar += "DTEND:" + result[i].end + "\n";
					calendar += "SUMMARY:" + result[i].title + "\n";
					calendar += "CLASS:PUBLIC\n";
					calendar += "DESCRIPTION:" + result[i].description + "\, " + result[i].location + "\n";
					//calendar += "DTSTAMP:20201002T073024Z\n";
					calendar += "END:VEVENT\n";
				}
				calendar += "END:VCALENDAR";
				res.send(calendar);
			}
			//	req.body.id
		})

	});


	app.get(['/sw.js'], context.bouncer('visitor'), (req, res) => {
		res.sendFile(req.url, {
			root: context.privatePath
		}, (error) => {
			if (error) {
				console.log(error);
				res.redirect('/forbidden');
			}
		});
	});

	// signup
	app.get('/signup', context.bouncer('visitor'), signupController.load);
	app.post('/signup', context.bouncer('visitor'), bodyParser.urlencoded({
		extended: true,
		parameterLimit: 20,
		limit: '50mb'
	}), signupController.create);
	app.get('/loginAvailable', signupController.exists);

	// signin and signout
	app.get('/signin', context.bouncer('visitor'), signinoutController.load);
	app.post('/signin', context.bouncer('visitor'), bodyParser.urlencoded({
		extended: false
	}), signinoutController.signin);
	app.get('/signout', context.bouncer('user'), signinoutController.signout);

	// connected home
	app.get(['/user/style.css', '/user/script.js'], context.bouncer('user'), (req, res) => {
		res.sendFile(req.url, {
			root: context.privatePath
		}, (error) => {
			if (error) {
				res.redirect('/forbidden');
			}
		});
	});
	app.get('/user', context.bouncer('user'), (req, res) => {
		res.sendFile('/user/index.html', {
			root: context.privatePath
		}, (error) => {
			if (error) {
				res.redirect('/forbidden');
			}
		});
	});

	// loading modules
	require('./modules')(context, app);

	app.get('/user/*', context.bouncer('user'), (req, res) => {
		res.redirect('/user');
	});

	app.get('/menu', context.bouncer('user'), (req, res) => {
		var userMenu = {};
		var promises = [];
		for (let i in context.menu) {
			if (context.menu.hasOwnProperty(i)) {
				promises.push(new Promise((resolve, reject) => {
					context.moduleCheckOnly(context.menu[i].authorisation, req).then((authorised) => {
						if (authorised) {
							userMenu[i] = context.menu[i];
							resolve();
						} else {
							resolve();
						}
					});
				}));
			}
		}
		Promise.all(promises).then(() => {
			res.json(userMenu);
		});
	});

	app.get('/header', context.bouncer('user'), (req, res) => {
		var userHeader = {};
		var promises = [];
		for (let i in context.header) {
			if (context.header.hasOwnProperty(i)) {
				promises.push(new Promise((resolve, reject) => {
					context.moduleCheckOnly(context.header[i].authorisation, req).then((authorised) => {
						if (authorised) {
							userHeader[i] = context.header[i];
							resolve();
						} else {
							resolve();
						}
					});
				}));
			}
		}
		Promise.all(promises).then(() => {
			res.json(userHeader);
		});
	});

	app.get('/userLocate', context.bouncer('user'), (req, res) => {
		const decode = jwt.verify(req.cookies.jwt, context.jwt);
		res.json({
			route: decode.route,
			location: decode.location,
			moduleName: decode.moduleName
		});
	});

	app.post('/userLocate', context.bouncer('user'), bodyParser.urlencoded({
		extended: false
	}), (req, res) => {
		const decode = jwt.verify(req.cookies.jwt, context.jwt);
		if (req.body.type == '') {
			req.body.type = 'internal';
			req.body.location = 'profile/-1';
			req.body.moduleName = 'profile';
		}
		req.body.route = context.services.caster.castRoute(req.body.type, req.body.location, req.body.moduleName);
		if (!findRoute(req.body.route, req.body.moduleName, context.enabledRoutesObject)) {
			req.body.route = '';
			req.body.location = '';
			req.body.moduleName = '';
			context.logger.info(req.body.route);
			context.logger.warning('Redirecting user : unable to find route');
		}

		jwt.sign({
			id: decode.id,
			login: decode.login,
			route: req.body.route,
			location: req.body.location,
			moduleName: req.body.moduleName
		}, context.jwt, {
			expiresIn: '1h'
		}, (errorJwt, token) => {
			if (errorJwt) {
				context.logger.error('Unable to get jwt');
				res.sendStatus(500);
			} else {
				res.cookie('jwt', token, {
					maxAge: context.sessionLife * 1000
				});
				res.sendStatus(200);
			}
		});
	});

	// errors
	app.get('/forbidden', context.bouncer('user'), (req, res) => {
		res.sendFile('forbidden/index.html', {
			root: context.privatePath
		});
	});

	app.get('/404', context.bouncer('all'), (req, res) => {
		res.sendFile('/404/index.html', {
			root: context.publicPath
		});
	});

	app.use('*', context.bouncer('visitor'), (req, res) => {
		res.redirect('/404');
	});
};
