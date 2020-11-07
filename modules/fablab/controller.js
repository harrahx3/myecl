exports.getHomePage = function(req, res) {
	var data={};
	req.engines['ejs'].renderFile('modules/fablab/body/home.ejs', data, (errorEjs, resultEjs) => {
		if (errorEjs) {
			req.logger.error(errorEjs);
			res.sendStatus(500);
		} else {
			console.log("getHomePage send");
			res.send(resultEjs);
		}
	});
};

exports.getAdminPage = function(req, res) {
	var data={};
	req.engines['ejs'].renderFile('modules/fablab/body/admin.ejs', data, (errorEjs, resultEjs) => {
		if (errorEjs) {
			req.logger.error(errorEjs);
			res.sendStatus(500);
		} else {
			console.log("getAdminPage send");
			res.send(resultEjs);
		}
	});
};

getProducts = function(req, res) {
	console.log("getProducts");
	req.database.query('SELECT * FROM FablabProducts;', [], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			var products=[];
			for (var i = 0; i < result.length; i++) {
				products.push(
					{
						id: result[i].id,
						name: result[i].name,
						type: result[i].type
					});
			}
		}
	});
};
