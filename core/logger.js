/* jshint esversion:6*/

/*
    Some basic functions to output messages
*/

module.exports = (context) => {
	var logger = {};

	const outputMessage = (pre, message) => {
		if (message.constructor == String) {
			var beautified = message.charAt(0).toUpperCase() + message.slice(1);
			if (beautified.charAt(beautified.length - 1) != '.')
				beautified = beautified + '.';
			console.log(pre + ' ' + beautified);
		} else {
			console.log(message);
		}
	};

	logger.title = (message) => {
		const l = message.length;
		console.log('#'.repeat(l + 4));
		console.log('# ' + message + ' #');
		console.log('#'.repeat(l + 4));
	};

	logger.done = () => {
		console.log('Done');
		console.log('');
	};

	logger.info = (message) => {
		outputMessage('[INFO   ]', message);
	};

	logger.warning = (message) => {
		outputMessage('[WARNING]', message);
	};

	logger.error = (message) => {
		outputMessage('[ERROR  ]', message);
	};

	context.logger = logger;
	context.logger.title('Log tools');
	context.logger.done();
};