exports.getAll = function (req, res) {
	var start_calendar = new Date(parseInt(req.query.start) * 1000);
	var end_calendar = new Date(parseInt(req.query.end) * 1000);

	var start_year = start_calendar.getFullYear();
	var start_month = start_calendar.getMonth() + 1;
	var start_date = start_calendar.getDate();

	start_calendar = start_year + '-' + start_month + '-' + start_date + ' 00:00:00';

	var end_year = end_calendar.getFullYear();
	var end_month = end_calendar.getMonth() + 1;
	var end_date = end_calendar.getDate();

	end_calendar = end_year + '-' + end_month + '-' + end_date + ' 00:00:00';

	req.database.query('SELECT * FROM BDECalendar WHERE start < ? OR end > ?', [end_calendar, start_calendar], (error, result) => {
		if (error) {
			req.log.error(error);
			res.sendStatus(500);
		} else {
			var events = [];
			for (let key in result) {
				events.push({
					id: result[key]['id'],
					start: result[key]['start'],
					end: result[key]['end'],
					allDay: false,
					title: result[key]['title'],
					description: result[key]['description'],
					location: result[key]['location'],
					organisation: result[key]['organisation'],
					target: result[key]['target'],
					className: result[key]['organisation'],
					organisationid: result[key]['organisationid'],
					targetid: result[key]['targetid']
				});
			}
			res.send(events);
		}
	});
};

/*getGroupId = function (req, res, a) {
	req.database.query('SELECT id FROM core_group WHERE name=?', [a], (error1, result1) => {
		if (error1) {
			req.log.error(error1);
			res.sendStatus(500);
		} else {
			var organisationid=0;
			for (let key in result1) {
				organisationid = result1[key]['id'],
			}
			return (organisationid);
		}
	});
};
*/


exports.add = function (req, res) {
	delOldEvents(req, res);
//	var i=getGroupId(req, res, "wei");
	req.database.query("INSERT INTO BDECalendar (title, description, start, end, organisation, location, target, organisationid, targetid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body.title, req.body.description, req.body.start, req.body.end, req.body.organisation, req.body.location, req.body.target, req.body.organisation, req.body.target], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};



delEvent = function (req, res) {

	req.database.query('SELECT id FROM AQHposts WHERE eventid = ?', [parseInt(req.body.id)], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		}
		else {
			var posts = [];
			for (let key in result) {
				posts.push(
					 result[key]['id']
				);
			}

			if (posts.length) {

				req.database.query("DELETE FROM AQHcomments WHERE postid IN (?)", [posts], (error, result) => {
					if (error) {
						req.logger.error(error);
						res.sendStatus(500);
					}

					else {
						req.database.query("DELETE FROM AQHposts WHERE id IN (?)", [posts], (error, result) => {
							if (error) {
								req.logger.error(error);
								res.sendStatus(500);
							}
						});
					}
				});
			}
		}
	});

	/*req.database.query("DELETE FROM AQHposts WHERE eventid = ?", [parseInt(req.body.id)], (error, result) => {
		if (error) {
			req.logger.error(error);
			req.sendStatus(500);
		}
	});
	*/

	req.database.query("DELETE FROM BDECalendar WHERE id = ?;", [parseInt(req.body.id)], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			return true;
		}
	});
};


exports.deleteEvent = function (req, res) {
	if (delEvent(req, res)) {
		res.sendStatus(200);
	} else {
		res.sendStatus(500);
	}
};


exports.getGroups = function (req, res){
	console.log("getGroups");
	//console.log(req);
	//console.log(res);
	//req.database.query("SELECT id, name, description FROM core_group;"), [], (error, result) => {
		req.database.query('SELECT id, name, description FROM core_group', [], (error, result) => {
			if (error) {
				req.log.error(error);
				res.sendStatus(500);
			} else {
				var events = [];
				for (let key in result) {
					events.push({
						id: result[key]['id'],
						name: result[key]['name'],
						description: result[key]['description'],
					});
				}
				res.send(events);
			}
		});
};

delOldEvents = function(req, res){
	console.log("delOldEvents");
	req.database.query('SELECT id, title, end FROM BDECalendar WHERE end<=NOW();', [], (error, result) => {
		if (error) {
			req.logger.error(error);
			return false;
		} else {
			for (var i = 0; i < result.length; i++) {
				console.log(result[i].title);
				req.body={};
				req.body.id = result[i].id;
				delEvent(req, res);
			}
			return true;
		}
//	req.body.id
	})
};

exports.deleteOldEvents = function  (req, res){
	console.log("deleteOldEvents");
		if (delOldEvents(req, res)) {
			res.sendStatus(200);
		} else {
			res.sendStatus(500);
		}
};

exports.iCal = function (req, res){
	var	calendar = "BEGIN:VCALENDAR"
	calendar += "VERSION:2.0"
	calendar += "PRODID:myecl"
	calendar += "X-PUBLISHED-TTL:P1W"
	calendar += "BEGIN:VEVENT"
	calendar += "UID:5f76d70fe8d4c"
	calendar += "DTSTART:20200902T060000Z"
	calendar += "SEQUENCE:0"
	calendar += "TRANSP:OPAQUE"
	calendar += "DTEND:20200902T080000Z"
	calendar += "SUMMARY:MyPhysique\, CM"
	calendar += "CLASS:PUBLIC"
	calendar += "DESCRIPTION:MyAMPHI 3_W1\, MME CALLARD Anne-Segolene"
	calendar += "DTSTAMP:20201002T073024Z"
	calendar += "END:VEVENT"
	calendar += "END:VCALENDAR"
	res.send(calendar);
};
