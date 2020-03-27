/*jshint esversion:6*/

module.exports = (context) => {
	var caster = {};

	const isAmong = (v, choices) => {
		return choices.includes(v);
	};

	const isArray = (v) => {
		return v.constructor == Array;
	};

	const isBoolean = (v) => {
		return v.constructor == Boolean;
	};

	const isNumber = (v) => {
		return v.constructor == Number;
	};

	const isObject = (v) => {
		return v.constructor == Object;
	};

	const isEmptyObject = (v) => {
		if (isObject(v)) {
			var keys = 0;
			for (let k in v) {
				// hasOwnProperty to eject unwanted inherited properties from constructor
				if (v.hasOwnProperty(k)) keys++;
			}
			return keys == 0;
		} else {
			throw 'Variable is not an object';
		}
	};

	const isString = (v) => {
		return v.constructor == String;
	};

	// Authorisation | String 
	//               | Object .groups (Groups) 
	//                        .negation (Boolean, optional, defaults to false)
	// Groups | Group
	//       | Array Group
	// Group | String
	//      | Object .name (String, optional if id) 
	//               .id (Number, optional if name)
	//               .term (Term, optional, defaults to empty)
	//               .position (Position, optional, defaults to empty)
	//               .negation (Boolean, optional, defaults to false)
	// Term | Number 
	//      | String (Number.toString)
	//      | Object .year (Number|String)
	//               .operation (in ['>', '>=', '==', '!=', '<=', '<'], optional, defaults to '==')
	// Position | String
	//          | Object .status (String)
	//                   .negation (Boolean, optional, defaults to false)

	const castSingleTypeOrArrayType = (field, castingFunction, origin, castedArray, moduleName = '', defaultAuthorisation = '') => {
		if (isObject(field) || isArray(field)) {
			if (isObject(field)) {
				field = [field];
			}
			for (let i = 0; i < field.length; i++) {
				if (isObject(field[i])) {
					try {
						const single = castingFunction(field[i], moduleName, defaultAuthorisation);
						if (!isEmptyObject(single)) {
							castedArray.push(single);
						}
					} catch (castingFunctionError) {
						throw castingFunctionError;
					}
				} else {
					throw origin + ' must only contain type Object';
				}
			}
		} else {
			throw orgin + ' must be of type Object or Array Object';
		}
	};

	const castTerm = (term) => {
		// allows for empty term, ignoring constraint
		var castedTerm = {};

		if (isNumber(term)) {
			castedTerm.year = term;
			castedTerm.operation = '==';
		} else if (isString(term)) {
			// allows for empty term, ignoring constraint
			if (term.length) {
				if (!isNaN(parseFloat(term))) {
					castedTerm.year = parseFloat(term);
					castedTerm.operation = '==';
				} else {
					throw 'Term.year of type String must be empty or a number';
				}
			}
		} else if (isObject(term)) {
			if (isEmptyObject(term)) {
				// allows for empty term, ignoring constraint
			} else if (term.hasOwnProperty('year')) {
				if (isNumber(term.year)) {
					castedTerm.year = term.year;
				} else if (isString(term.year)) {
					// allows for empty term, ignoring constraint
					if (term.year.length) {
						if (!isNaN(parseFloat(term.year))) {
							castedTerm.year = parseFloat(term.year);
						} else {
							throw 'Term.year of type String must be empty or a number';
						}
					}
				} else {
					throw 'Term.year must be of type String or Number';
				}

				// allows for empty term if no year, ignoring constraint
				if (term.hasOwnProperty('year')) {
					if (term.hasOwnProperty('operation')) {
						if (isAmong(term.operation, ['>', '>=', '==', '!=', '<=', '<'])) {
							castedTerm.operation = term.operation;
						} else {
							throw 'Term.operation must be in [' > ', ' >= ', ' == ', ' != ', ' <= ', ' < ']';
						}
					} else {
						castedTerm.operation = '==';
					}
				}
			} else {
				throw 'Term of type Object must be empty or own property year';
			}
		} else {
			throw 'Term must be of type String or Number or Object';
		}

		return castedTerm;
	};

	const castPosition = (position) => {
		// allows for empty position, ignoring constraint
		var castedPosition = {};

		if (isString(position)) {
			// allows for empty position, ignoring constraint
			if (position.length) {
				castedPosition.status = position;
				castedPosition.negation = false;
			}
		} else if (isObject(position)) {
			if (isEmptyObject(position)) {
				// allows for empty position, ignoring constraint
			} else if (position.hasOwnProperty('status')) {
				if (isString(position.status)) {
					// allows for empty term, ignoring constraint
					if (position.status.length) {
						castedPosition.status = position.status;

						// casting operation
						if (position.hasOwnProperty('negation')) {
							if (isBoolean(position.negation)) {
								castedPosition.negation = position.negation;
							} else {
								throw 'Position.negation must be of type Boolean';
							}
						} else {
							castedPosition.negation = false;
						}
					}
				} else {
					throw 'Position.status must be of type String';
				}
			} else {
				throw 'Position of type Object must be empty or own property status';
			}
		} else {
			throw 'Position must be of type String or Object';
		}

		return castedPosition;
	};

	const castGroup = (group, moduleName, defaultAuthorisation) => {
		// allows for empty group if no name and no id
		var castedGroup = {};

		if (group.hasOwnProperty('id')) {
			if (isNumber(group.id)) {
				castedGroup.id = group.id;
			} else if (isString(group.id)) {
				if (group.id.length) {
					if (!isNaN(parseInt(group.id))) {
						castedGroup.id = parseInt(group.id);
					} else {
						throw 'Group.id of type String must be empty or a number';
					}
				}
			} else {
				throw 'Group.id must be of type Number or Number.toString or empty';
			}
		}

		if (group.hasOwnProperty('name')) {
			if (isString(group.name)) {
				// allows for empty name, ignoring property
				if (group.name.length) {
					castedGroup.name = group.name;
				}
			} else {
				throw 'Group.name must be of type String';
			}
		}

		if (castedGroup.hasOwnProperty('id') || castedGroup.hasOwnProperty('name')) {
			// adding negation if castedGroup not empty
			if (group.hasOwnProperty('negation')) {
				if (isBoolean(group.negation)) {
					castedGroup.negation = group.negation;
				} else {
					throw 'Group.negation must be of type Boolean';
				}
			} else {
				castedGroup.negation = false;
			}

			if (group.hasOwnProperty('term')) {
				try {
					const castedTerm = castTerm(group.term);
					if (!isEmptyObject(castedTerm)) {
						castedGroup.term = castedTerm;
					}
				} catch (castTermError) {
					throw castTermError;
				}
			}

			if (group.hasOwnProperty('position')) {
				try {
					const castedPosition = castPosition(group.position);
					if (!isEmptyObject(castedPosition)) {
						castedGroup.position = castedPosition;
					}
				} catch (castPositionError) {
					throw castPositionError;
				}
			}
		}

		return castedGroup;
	};

	const castGroups = (groups) => {
		var castedGroups = [];

		if (isString(groups) || isObject(groups) || isArray(groups)) {
			if (isString(groups)) {
				groups = [{
					name: groups,
					negation: false
				}];
			} else if (isObject(groups)) {
				groups = [groups];
			}
			castSingleTypeOrArrayType(groups, castGroup, 'module.groups', castedGroups);

		} else {
			throw 'Authorisation.groups must be of type String or Object or Array';
		}


		return castedGroups;
	};

	const castAuthorisation = (configuration) => {
		var castedConfiguration = {
			groups: [],
			negation: false
		};

		if (isString(configuration)) {
			// allows for empty groups if no group provided, acts like no bouncer
			if (configuration.length) {
				castedConfiguration.groups.push({
					name: configuration,
					negation: false
				});
			}
		} else if (isObject(configuration)) {
			if (isEmptyObject(configuration)) {
				// allows for empty groups if no group provided, acts like no bouncer
			} else if (configuration.hasOwnProperty('groups')) {
				// casting groups
				try {
					castedConfiguration.groups = castGroups(configuration.groups);
				} catch (castGroupsError) {
					throw castGroupsError;
				}

				// casting negation
				if (configuration.hasOwnProperty('negation')) {
					if (isBoolean(configuration.negation)) {
						castedConfiguration.negation = configuration.negation;
					} else {
						throw 'Authorisation.negation must be of type Boolean';
					}
				}
			} else {
				throw 'Authorisation of type Object must be empty or own property groups';
			}
		} else {
			throw 'Authorisation must be of type String or Object';
		}
		return castedConfiguration;
	};


	// ModuleConfig | Object .description (String, optional, defaults to '')
	//                       .authorisation (Authorisation, optional, defaults to '')
	//                       .beta (Boolean, optional, defaults to false)
	//                       .contact (Contact)
	//                       .tables (|Table |Array Table)
	//                       .includes (Includes)
	//                       .rules (|Rule |Array Rule)
	//                       .header (|Header |Array Header)
	//                       .menu (|Menu |Array Menu)
	// Contact | Object .firstname (String, optional defaults to 'Association Éclair')
	//                  .lastname (String, optional, defaults to '')
	//                  .phone (String, optional, defaults to '')
	//                  .email (String, optional, defaults to 'bureau-eclair@listes.ec-lyon.fr')
	// Table | Object .name (String)
	//                .schema (Object)
	// Includes | Object .scripts (|String |Array String, optional, defaults to [])
	//                   .styles (|String |Array String, optional, defauts to [])
	//                   .misc (|Misc |Array Misc, optional, defaults to [])
	// Misc | String 
	//      | Object .file(String) .location(String)
	// Rule | Object .viewport (
	//                          Object .type (in ['internal', 'external'])
	//                                 .location (String)
	//                                 .method (in ['POST', 'GET', 'PUT', 'DELETE', 'HEAD', 'ALL'], optional, default to 'GET', ignored if .call.type != 'callback')
	//                                 .enctype (in ['urlencoded', 'json', 'raw', 'multipart'], optional, defaults to 'urlencoded', only read if .method == 'POST')
	//                                 .options (Object, optional, defaults by body-parser or multer)
	//                         )
	//               .call (
	//                          Object .type (in ['static', 'callback', 'middleware'])
	//                                 .location (String)
	//                     )
	//               .includes (Includes, optional, defaults to [])
	//               .authorisation (Authorisation, optional, defaults to module authorisation)
	// Header | Object .icon (String)
	//                 .name (String, optional, defaults to '')
	//                 .authorisation (Authorisation, optional, defaults to module authorisation)
	//                 .type (in ['internal', 'external'])
	//                 .anchor (String)
	// Menu | Object .icon (String, optional, defaults to '')
	//               .name (String)
	//               .authorisation (Authorisation, optional, defaults to module authorisation)
	//               .type (in ['internal', 'external', 'submenu'])
	//               .anchor (|String (if type != 'submenu') |Array Menu (if type == 'submenu'))

	// casting functions receive an object, return casted object, can be {}
	const castTable = (table, moduleName, defaultAuthorisation) => {
		var castedTable = {};

		const nameSet = table.hasOwnProperty('name') && isString(table.name) && table.name.length;
		const schemaSet = table.hasOwnProperty('schema') && isObject(table.schema) && !isEmptyObject(table.schema);
		if (nameSet || schemaSet) {
			if (nameSet) {
				if (schemaSet) {
					castedTable.name = table.name;
					castedTable.schema = {};
					for (let i in table.schema) {
						// hasOwnProperty to eject unwanted inherited properties from constructor
						if (table.schema.hasOwnProperty(i) && isString(i) && isString(table.schema[i])) {
							castedTable.schema[i] = table.schema[i];
						} else {
							throw 'Table.schema must only contain type String';
						}
					}
				} else {
					throw 'Table must own property schema of type Object';
				}
			} else {
				throw 'Table must own property name of type String';
			}
		} else {
			context.logger.warning('Table not properly defined, ignoring');
		}

		return castedTable;
	};

	const castRoute = (type, location, moduleName) => {
		var route = '';
		switch (type) {
			case 'internal':
				route = context.internalRoute;
				break;
			case 'external':
				route = context.externalRoute;
				break;
			case 'scripts':
				route = context.scriptsRoute;
				break;
			case 'styles':
				route = context.stylesRoute;
				break;
			case 'misc':
				route = context.miscRoute;
				break;
			case 'includesModule':
				route = context.includesModuleRoute;
				break;
			case 'includesRule':
				route = context.includesRuleRoute;
				break;
			default: // contaxt
				route = context.contactRoute;
				break;
		}
		return route.replace('MODULENAME', moduleName).replace('LOCATION', location);
	};

	const castIncludes = (includes, origin, casted, moduleName) => {
		casted.scripts = [];
		casted.styles = [];
		casted.misc = [];

		if (isObject(includes)) {
			const castAsset = (type, dump) => {
				if (includes.hasOwnProperty(type)) {
					if (isString(includes[type]) || isObject(includes[type]) || isArray(includes[type])) {
						if (isString(includes[type]) || isObject(includes[type])) {
							includes[type] = [includes[type]];
						}
						for (let i = 0; i < includes[type].length; i++) {
							if (isString(includes[type][i]) || isObject(includes[type][i])) {
								if (isString(includes[type][i])) {
									includes[type][i] = {
										file: includes[type][i],
										location: includes[type][i]
									};
								}
								if (includes[type][i].hasOwnProperty('file')) {
									if (isString(includes[type][i].file)) {
										if (includes[type][i].file.length) {
											var include = {
												file: includes[type][i].file,
												location: (includes[type][i].hasOwnProperty('location') && isString(includes[type][i].location) && includes[type][i].location.length) ? includes[type][i].location : includes[type][i].file
											};
											include.route = castRoute(type, include.location, moduleName);
											dump.push(include);
										} else {
											context.logger.warning('Empty includes ' + type + ', ignoring');
										}
									} else {
										context.logger.warning('Illegal includes ' + type + ', ignoring');
									}
								} else {
									context.logger.warning('Empty includes ' + type + ', ignoring');
								}

							} else {
								throw origin + '.includes.' + type + ' must be String or Object ';
							}
						}
					} else {
						throw origin + '.includes.' + type + '+ must be of type String or Array';
					}
				}
			};

			castAsset('scripts', casted.scripts);
			castAsset('styles', casted.styles);
			castAsset('misc', casted.misc);

		} else {
			throw origin + '.includes must be of type Object';
		}
	};

	const castRule = (rule, moduleName, defaultAuthorisation) => {
		var castedRule = {};

		const callSet = rule.hasOwnProperty('call') && isObject(rule.call) &&
			rule.call.hasOwnProperty('type') && isAmong(rule.call.type, ['static', 'callback', 'middleware']) &&
			rule.call.hasOwnProperty('location') && isString(rule.call.location) && rule.call.location.length;
		const viewportSet = rule.hasOwnProperty('viewport') && isObject(rule.viewport) &&
			rule.viewport.hasOwnProperty('type') && isAmong(rule.viewport.type, ['internal', 'external']) &&
			rule.viewport.hasOwnProperty('location') && isString(rule.viewport.location) && rule.viewport.location.length;

		if (callSet || viewportSet) {
			if (callSet) {
				if (viewportSet) {
					castedRule.call = rule.call;
					castedRule.viewport = {
						type: rule.viewport.type,
						location: rule.viewport.location
					};

					castedRule.includes = {};
					if (rule.hasOwnProperty('includes')) {
						castIncludes(rule.includes, 'rule', castedRule.includes, moduleName);
					}

					if (rule.hasOwnProperty('authorisation')) {
						try {
							castedRule.authorisation = castAuthorisation(rule.authorisation);
						} catch (castAuthorisationError) {
							throw castAuthorisationError;
						}
					} else {
						castedRule.authorisation = defaultAuthorisation;
					}

					// method, enctype, options, only if call.type == 'callback'
					if (castedRule.call.type == 'callback') {
						castedRule.viewport.method = 'get';
						if (rule.viewport.hasOwnProperty('method') && isAmong(rule.viewport.method.toLowerCase(), ['get', 'post', 'all', 'put', 'delete', 'head'])) {
							castedRule.viewport.method = rule.viewport.method.toLowerCase();
						}

						if (castedRule.viewport.method == 'post') {
							castedRule.viewport.enctype = 'urlencoded';
							castedRule.viewport.options = {
								extended: false
							};
							if (rule.viewport.hasOwnProperty('enctype') && isAmong(rule.viewport.enctype.toLowerCase(), ['urlencoded', 'json', 'raw', 'multipart'])) {
								castedRule.viewport.enctype = rule.viewport.enctype.toLowerCase();
							}
							if (rule.viewport.hasOwnProperty('options') && isObject(rule.viewport.options)) {
								castedRule.viewport.options = rule.viewport.options;
							}
						}
					}
				} else {
					throw 'Rule must own property viewport of type Object';
				}
			} else {
				throw 'Rule must own property call of type Object';
			}
		} else {
			context.logger.warning('Rule not properly defined, ignoring');
		}

		return castedRule;
	};

	const castHeader = (header, moduleName, defaultAuthorisation) => {
		var castedHeader = {};

		const iconSet = header.hasOwnProperty('icon') && isString(header.icon) && header.icon.length;
		const typeSet = isAmong(header.type, ['internal', 'external']);
		const anchorSet = header.hasOwnProperty('anchor') && isString(header.anchor) && header.anchor.length;

		if (iconSet || typeSet || anchorSet) {
			if (iconSet) {
				if (typeSet) {
					if (anchorSet) {
						castedHeader.icon = header.icon;
						castedHeader.type = header.type;
						castedHeader.anchor = header.anchor;
						castedHeader.route = castRoute(castedHeader.type, castedHeader.anchor, moduleName);

						if (header.hasOwnProperty('name') && isString(header.name)) {
							castedHeader.name = header.name;
						}

						if (header.hasOwnProperty('authorisation')) {
							try {
								castedHeader.authorisation = castAuthorisation(header.authorisation);
							} catch (castAuthorisationError) {
								throw castAuthorisationError;
							}
						} else {
							castedHeader.authorisation = defaultAuthorisation;
						}
					} else {
						throw 'Header must own property anchor of type String';
					}
				} else {
					throw 'Header must own property type in [internal, external]';
				}
			} else {
				throw 'Header must own property icon of type String';
			}
		} else {
			context.logger.warning('Header not properly defined, ignoring');
		}
		return castedHeader;
	};

	const castMenu = (menu, moduleName, defaultAuthorisation) => {
		var castedMenu = {};

		const nameSet = menu.hasOwnProperty('name') && isString(menu.name) && menu.name.length;
		const typeSet = isAmong(menu.type, ['internal', 'external', 'submenu']);
		const anchorSet = menu.hasOwnProperty('anchor') && ((isString(menu.anchor) && menu.anchor.length) ||
			(isArray(menu.anchor) && menu.anchor.length));

		if (nameSet || typeSet || anchorSet) {
			if (nameSet) {
				if (typeSet) {
					if (anchorSet) {
						castedMenu.name = menu.name;
						castedMenu.type = menu.type;

						if (menu.hasOwnProperty('icon') && isString(menu.icon)) {
							castedMenu.icon = menu.icon;
						}

						if (menu.hasOwnProperty('authorisation')) {
							try {
								castedMenu.authorisation = castAuthorisation(menu.authorisation);
							} catch (castAuthorisationError) {
								throw castAuthorisationError;
							}
						} else {
							castedMenu.authorisation = defaultAuthorisation;
						}

						if (menu.type == 'submenu') {
							if (isArray(menu.anchor) && menu.anchor.length) {
								castedMenu.anchor = [];
								for (let i = 0; i < menu.anchor.length; i++) {
									try {
										castedMenu.anchor.push(castMenu(menu.anchor[i], castedMenu.authorisation));
									} catch (castMenuError) {
										throw castMenuError;
									}
								}
							} else {
								throw 'Menu.anchor must be of type non-empty Array if menu.type=submenu';
							}
						} else {
							if (isString(menu.anchor) && menu.anchor.length) {
								castedMenu.anchor = menu.anchor;
								castedMenu.route = castRoute(castedMenu.type, castedMenu.anchor, moduleName);
							} else {
								throw 'Menu.anchor must be of type String if menu.type!=submenu';
							}
						}
					} else {
						throw 'Menu must own property anchor of type String';
					}
				} else {
					throw 'Menu must own property type in [internal, external, submenu]';
				}
			} else {
				throw 'Menu must own property name of type String';
			}
		} else {
			context.logger.warning('Menu not properly defined, ignoring');
		}
		return castedMenu;
	};

	const castModuleConfig = (moduleName, configuration) => {
		var castedModuleConfig = {
			description: '',
			authorisation: {
				groups: [],
				negation: false
			},
			beta: false,
			contact: {
				firstname: 'Association Éclair',
				lastname: '',
				phone: '',
				email: 'bureau-eclair@listes.ec-lyon.fr'
			},
			tables: [],
			includes: [],
			rules: [],
			header: [],
			menu: []
		};

		// casting description, defaulting to empty
		if (configuration.hasOwnProperty('description')) {
			if (isString(configuration.description)) {
				castedModuleConfig.description = configuration.description;
			} else {
				context.logger.warning('Invalid description, defaulting to empty');
			}
		} else {
			context.logger.warning('No description found, defaulting to empty');
		}

		// casting authorisation, defaulting to connected user (see bounce('user');)
		if (configuration.hasOwnProperty('authorisation')) {
			try {
				castedModuleConfig.authorisation = castAuthorisation(configuration.authorisation);
			} catch (castAuthorisationError) {
				throw castAuthorisationError;
			}
		} else {
			context.logger.warning('No authorisation specified, defaulting to user');
		}

		// casting beta
		if (configuration.hasOwnProperty('beta')) {
			if (isBoolean(configuration.beta)) {
				castedModuleConfig.beta = configuration.beta;
			} else {
				context.logger.warning('Beta argument illegal defaulting to false');
			}
		} else {
			context.logger.warning('No beta argument found, defaulting to false');
		}

		// casting contact only if four parameters valid
		if (configuration.hasOwnProperty('contact') && isObject(configuration.contact)) {
			if (configuration.contact.hasOwnProperty('firstname') && isString(configuration.contact.firstname) &&
				configuration.contact.hasOwnProperty('lastname') && isString(configuration.contact.lastname) &&
				configuration.contact.hasOwnProperty('phone') && isString(configuration.contact.phone) &&
				configuration.contact.hasOwnProperty('email') && isString(configuration.contact.email)) {
				castedModuleConfig.contact = {
					firstname: configuration.contact.firstname,
					lastname: configuration.contact.lastname,
					phone: configuration.contact.phone,
					email: configuration.contact.email
				};
			} else {
				context.logger.info('No valid contact found, defaulting to Éclair');
			}
		} else {
			context.logger.info('No valid contact found, defaulting to Éclair');
		}

		// casting tables
		if (configuration.hasOwnProperty('tables')) {
			castSingleTypeOrArrayType(configuration.tables, castTable, 'module.tables', castedModuleConfig.tables);
		}

		// casting includes
		if (configuration.hasOwnProperty('includes')) {
			try {
				castIncludes(configuration.includes, 'module.includes', castedModuleConfig.includes, moduleName);
			} catch (castIncludesError) {
				throw castIncludesError;
			}
		}

		// for the three remaining properties, if no authorisation is provided, module authorisation is used

		// casting rules
		if (configuration.hasOwnProperty('rules')) {
			castSingleTypeOrArrayType(configuration.rules, castRule, 'module.rules', castedModuleConfig.rules, moduleName, castedModuleConfig.authorisation);
		}

		// casting header
		if (configuration.hasOwnProperty('header')) {
			castSingleTypeOrArrayType(configuration.header, castHeader, 'module.header', castedModuleConfig.header, moduleName, castedModuleConfig.authorisation);
		}

		// casting menu
		if (configuration.hasOwnProperty('menu')) {
			castSingleTypeOrArrayType(configuration.menu, castMenu, 'module.menu', castedModuleConfig.menu, moduleName, castedModuleConfig.authorisation);
		}

		return castedModuleConfig;
	};

	caster.castRoute = castRoute;
	caster.castAuthorisation = castAuthorisation;
	caster.castModuleConfig = castModuleConfig;
	return caster;
};