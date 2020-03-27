/*jshint esversion: 6 */

/*
	Entry point of the application
	Builds context with every file of ./core
*/

var context = {};
require('./core/logger')(context);
require('./core/crypter')(context);

require('./core/config')('config.json', context);
require('./core/engines')(context);

require('./core/database')(context);
require('./core/tokenizer')(context);

require('./core/services')(context);
require('./core/bouncer')(context);

// Finally launches the application
var init = require('./core/init');
init.launch(context);