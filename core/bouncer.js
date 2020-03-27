/* jshint esversion:6 */


/*
    Provides middleware that authorises a user according to privileges
*/

var jwt = require('jsonwebtoken');

module.exports = (context) => {
	var bouncer = {};

	// no rejection
	bouncer.all = (req, res, next) => {
		next();
	};


	// only not connected users allowed
	bouncer.visitor = (req, res, next) => {
		if (req.cookies.jwt) {
			try {
				jwt.verify(req.cookies.jwt, context.jwt);
				res.redirect('/user');
			} catch (err) {
				res.redirect('/signout');
			}
		} else {
			next();
		}
	};

	// only connected users allowed
	bouncer.user = (req, res, next) => {
		if (!req.cookies.jwt) {
			context.logger.info('Access denied to ' + req.url + ': not connected');
			res.redirect('/');
		} else {
			try {
				var decode = jwt.verify(req.cookies.jwt, context.jwt);
				req.user = {
					id: decode.id,
					login: decode.login
				};
				next();
			} catch (error) {
				context.logger.info('Access denied to ' + req.url + ': not connected');
				res.redirect('/signout');
			}
		}
	};

	bouncer.group = (authorisation, req, callback) => {
		try {
			var configuration = context.services.caster.castAuthorisation(authorisation);
		} catch (authorisationCastError) {
			console.log(authorisationCastError);
			// context.logger.error(authorisationCastError);
			res.sendStatus(500);
			callback(false);
		}

		context.services.user.groups(req.user.id, 'id', (raw) => {
			var names = raw.names.split(',');
			var ids = raw.ids.split(',');
			var positions = raw.positions.split(',');
			var terms = raw.terms.split(',');

			var matched = true;
			var groupMismatch = false;
			var i = 0;

			// for each rule while no groupMismatch and matched
			// (once matched is false, it will remain false since &&)
			while (i < configuration.groups.length && !groupMismatch && matched) {
				var rule = configuration.groups[i];
				// checking if user in group
				var groupIndexIndex = -1;
				if (rule.hasOwnProperty('id')) {
					groupIndexIndex = ids.indexOf(rule.id.toString());
				}
				var groupIndexName = -1;
				if (rule.hasOwnProperty('name')) {
					groupIndexName = names.indexOf(rule.name);
				}

				// two groups were found
				groupMismatch = groupIndexIndex != -1 && groupIndexName != -1 && groupIndexIndex != groupIndexName;

				if (!groupMismatch) {
					var inGroup = groupIndexIndex != -1 || groupIndexName != -1;
					var groupIndex = groupIndexIndex != -1 ? groupIndexIndex : groupIndexName;

					// inGroup is not going to change according to constraints
					if (!inGroup) {
						matched = rule.negation;
					} else {
						// inGroup is going to change according to constraints

						// verifying term constraint
						if (rule.hasOwnProperty('term')) {
							var termOperation = rule.term.operation;
							var termRule = rule.term.year;
							var termUser = parseInt(terms[groupIndex]);

							var comparison = {
								'>': (x) => {
									return x > 0;
								},
								'>=': (x) => {
									return x >= 0;
								},
								'==': (x) => {
									return x == 0;
								},
								'!=': (x) => {
									return x != 0;
								},
								'<=': (x) => {
									return x <= 0;
								},
								'<': (x) => {
									return x < 0;
								}
							};

							inGroup = inGroup && comparison[termOperation](termUser - termRule);
						}

						// verifying position constraint
						if (rule.hasOwnProperty('position')) {
							var positionNegation = rule.position.negation;
							var positionRule = rule.position.status;
							var positionUser = positions[groupIndex];

							inGroup = inGroup && (positionNegation != (positionRule == positionUser));
						}

						// user in group and inclusion asked
						matched = inGroup != rule.negation;
					}
				}
				i++;
			}

			if (groupMismatch) {
				context.logger.error('Double reference to group mismatch');
				res.sendStatus(500);
				callback(false);
			} else {
				callback(configuration.negation != matched);
				// if (configuration.negation != matched) {
				// 	next();
				// } else {
				// 	res.redirect('/forbidden');
				// }
			}
		});
	};

	// only users selected by module configuration allowed, must be called after bouncer('user')
	// authorisation must be type Authorisation
	bouncer.module = (authorisation) => {
		return (req, res, next) => {
			bouncer.group(authorisation, req, (result) => {
				if (result) {
					next();
				} else {
					res.redirect('/forbidden');
				}
			});
		};
	};

	context.bouncer = (mode) => {
		if (bouncer[mode]) {
			return bouncer[mode];
		} else {
			return bouncer.all;
		}
	};

	context.moduleCheckOnly = (authorisation, req) => {
		return new Promise((resolve, reject) => {
			bouncer.group(authorisation, req, (result) => {
				resolve(result);
			});
		});
	};
};