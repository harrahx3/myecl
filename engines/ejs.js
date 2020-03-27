/* jshint esversion:6*/

const ejs = require('ejs');
const fs = require('fs');

exports.name = 'ejs';

exports.render = function (template, values) {
	return ejs.render(template, values, {});
};


exports.renderFile = function (templateFile, values, cb) {
	ejs.renderFile(templateFile, values, {}, function (err, template) {
		if (err) {
			cb(err);
		} else {
			cb(null, template);
		}
	});
};

exports.compile = function (template) {
	return ejs.compile(template);
};

exports.compileFile = function (templateFile, cb) {
	fs.readFile(templateFile, function (template) {
		cb(null, ejs.compile(template));
	});
};