exports.addComment = function (req, res) {
	console.log("addComment");
	req.database.query('INSERT INTO AQHcomments (content, date, author, postid) VALUES (?, NOW(), ?, ?);', [req.body.content, req.user.id, req.body.postid], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
}

exports.getAllEvents = function (req, res) {
	console.log("getAllEvents");
	req.database.query("SET lc_time_names = 'fr_FR';", (errorl, resultl) => {
//});

	//get all events
//	req.database.query('SELECT e.id as id, e.description as content, e.start as date, e.organisationid as author, e.title as title FROM BDECalendar AS e ORDER BY e.start DESC;', (error, result) => {
		req.database.query('SELECT t.id as id, t.content as content, DATE_FORMAT(t.date, "%W %D %b %Y") as date, t.organisationid as author, t.title as title, t.id_user as miduser, g.name AS organisateur FROM (SELECT e.id as id, e.description as content, e.start as date, e.organisationid as organisationid, e.title as title, m.id_user as id_user FROM BDECalendar AS e JOIN core_membership AS m ON e.organisationid=m.id_group) AS t JOIN core_group AS g ON t.organisationid=g.id ORDER BY date DESC;', (error, result) => {

		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {

			var data = {
				events: []
			};

			if (result.length > 0) {
				for (let i in result) {
				//	console.log(result);
					//console.log(result[i]);
					var admin = (result[i]['miduser'] == req.user.id);
					var event={
						id: result[i]['id'],
						date: result[i]['date'],
						title: result[i]['title'],
						content: result[i]['content'],
						author: result[i]['author'],
						admin: admin,
						organisateur: result[i]['organisateur'],
						posts: []
					};
					var add=true;
					for (var j in data.events) {
						if (data.events[j].id==event.id) {
							add=false;
							if (!data.events[j].admin && admin) {
								data.events[j].admin=true;
							}
						}
					}
					if (add) {
						data.events.push(event);
					}
				}

				//get all the comments
				var comments = [];
				req.database.query('SELECT c.id as id, c.content as content, DATE_FORMAT(c.date, "%D %b") as date, u.nick as author, c.postid as postid FROM AQHcomments AS c JOIN core_user AS u ON c.author=u.id ORDER BY c.date ASC;', (errorC, resultC) => {
					if (errorC) {
						req.logger.error(errorC);
						res.sendStatus(500);
					} else {
						if (resultC.length > 0) {
							for (c of resultC) {
								comments.push({
									id: c['id'],
									content: c['content'],
									date: c['date'],
									author: c['author'],
									postid: c['postid']
								});
							}
						}
					}

					// get all posts
					req.database.query('SELECT p.id as id, p.content as content, DATE_FORMAT(p.date, "%W %D %b %Y") as date, u.nick as author, p.eventid as eventid FROM AQHposts AS p JOIN core_user AS u ON p.author=u.id ORDER BY p.date DESC;', (errorQuery, resultQuery) => {
						if (errorQuery) {
							req.logger.error(errorQuery);
							res.sendStatus(500);
						} else {
							//console.log(resultQuery.length)
							if (resultQuery.length > 0) {
								var posts = [];
								for (r of resultQuery) {
									console.log(r['date']);
									var post={
										id: r['id'],
										content: r['content'],
										date: r['date'],
										author: r['author'],
										eventid: r['eventid'],
										comments: []
									};

									// associate comments to posts
									for (var i in comments) {
										if (comments[i].postid==post.id) {
											post.comments.push(comments[i]);
										}
									}

										// associate the post to the event
										for (var i in data.events) {
											if (data.events[i].id == r['eventid']) {
												data.events[i].posts.push(post);
												break;
											}
										}
									//	if (data.events[data.events.length - r['eventid']])
										//	data.events[data.events.length - r['eventid']].posts.push(post);
									}
								}
							}
									//	console.log("data1:");
								//		console.log(data);
										//console.log("end");

							// render the html page sent to the client from ejs file
							req.engines['ejs'].renderFile('modules/aqh/body/home.ejs', data, (errorEjs, resultEjs) => {
								if (errorEjs) {
									req.logger.error(errorEjs);
									res.sendStatus(500);
								} else {
									//console.log(resultEjs);
									res.send(resultEjs);
								}
							});

						});

				});

		//	}
		//});

			}
		}
	});
	});
};

exports.getOne = function (req, res) {
	req.database.query('SELECT p.id as id, p.content as content, p.date as date, u.nick as author FROM AQHposts AS p JOIN core_user AS u ON u.id = p.author WHERE p.id = ?;', [req.query.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			if (result.length > 0) {
			//	console.log(result);
				res.json({
					id: result[0]['id'],
					content: result[0]['content'],
					date: result[0]['date'],
					author: result[0]['author']
				});
			//	console.log(res);
			//	console.log(result[0]['date']);
			} else {
				res.json({
					id: "-1",
					content: "Le post n'a pas pu être trouvée",
					date: "21/04/1998",
					author: ""
				});
			}
		}
	});
};

exports.getAll = function (req, res) {
	req.database.query('SELECT p.id as id, p.content as content, p.date as date, u.nick as author FROM AQHposts AS p JOIN core_user AS u ON u.id = p.author ORDER BY p.date DESC;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				posts: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.posts.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content'],
						author: result[i]['author']
					});
				}
			}
			res.json(data);
		}
	});
};

exports.getAllFrom = function (req, res) {
	req.database.query('SELECT p.id as id, p.content as content, p.date as date, u.nick as author FROM AQHposts AS p JOIN core_user AS u ON u.id = p.author WHERE p.author=? ORDER BY p.date DESC;', [req.user.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				posts: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.posts.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content'],
						author: result[i]['author']
					});
				}
			}
			res.json(data);
		}
	});
};


exports.add = function (req, res) {
	console.log("add");
	req.database.query('INSERT INTO AQHposts (content, date, author, eventid) VALUES (?, NOW(), ?, ?);', [req.body.content, req.user.id, req.body.eventid], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.update = function (req, res) {
	console.log("update");
	req.database.query('UPDATE AQHposts SET content = ? WHERE id = ?;', [req.body.content, req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.delete = function (req, res) {
	req.database.query('DELETE FROM AQHposts WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.deleteComment = function (req, res) {
	req.database.query('DELETE FROM AQHcomments WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.getALLData = function (req, res) {
	req.database.query('\
		SELECT p.id, p.content, c.author, c.content FROM core_users AS u \
		JOIN (\
			SELECT c.id AS id, c.content AS content, c.author AS author, p.date AS date FROM AQHcomments AS c \
			JOIN AQHposts AS p \
			ON c.postid = p.id) AS req\
		ON req.author=u.id \
		ORDER BY req.date DESC ;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				posts: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.posts.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content'],
						author: result[i]['author']
					});
				}
			}
			res.json(data);
		}
	});
};

exports.getComments = function (req, res) {
	req.database.query('SELECT c.id as id, c.content as content, c.date as date, c.author as author FROM AQHcomments AS c JOIN AQHposts AS p ON c.postid = p.id  ORDER BY p.date DESC;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				comments: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.comments.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content'],
						author: result[i]['author']
					});
				}
			}
			res.json(data);
		}
	});
};

exports.getPostComments = function (req, res) {
	console.log("getPostComments");
	req.database.query('SELECT c.id as id, c.content as content, c.date as date, c.author as author FROM AQHcomments AS c JOIN AQHposts AS p ON c.postid = p.id WHERE p.id=? ORDER BY p.date DESC;', [req.body.postid], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				comments: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.comments.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content'],
						author: result[i]['author'],
					});
				}
			}
			res.json(data);
		}
	});
};


exports.getPostsForEvent = function (req, res) {
	console.log("getPostsForEvent");
	req.database.query('SELECT p.id as id, p.content as content, p.date as date, p.author as author FROM AQHposts AS p JOIN AQHevents AS e ON p.eventid = e.id WHERE e.id=? ORDER BY p.date DESC;', [req.body.eventid], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				posts: []
			};
			if (result.length > 0) {
				for (let post of result) {
					data.posts.push({
						id: post['id'],
						date: post['date'],
						content: post['content'],
						author: post['author']
					});
				}
			}
			res.json(data);
		}
	});
};


// get the list of all events in BDECalendar with all posts associated to each one
/*exports.getAllEvents = function (req, res) {
	console.log("getAllEvents");

	//get all events
	req.database.query('SELECT e.id as id, e.description as content, e.start as date, e.organisation as author, e.title as title FROM BDECalendar AS e ORDER BY e.start DESC;', (error, result) => {

		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {

			var data = {
				events: []
			};

			if (result.length > 0) {
				for (let i in result) {
					console.log(result);
					console.log(result[i]);
					var event={
						id: result[i]['id'],
						date: result[i]['date'],
						title: result[i]['title'],
						content: result[i]['content'],
						author: result[i]['author'],
						posts: []
					};
					data.events.push(event);

				}

					// get all posts
					req.database.query('SELECT p.id as id, p.content as content, p.date as date, p.author as author, p.eventid as eventid FROM AQHposts AS p ORDER BY p.date DESC;', (errorQuery, resultQuery) => {
						if (errorQuery) {
							req.logger.error(errorQuery);
							res.sendStatus(500);
						} else {
							//console.log(resultQuery.length)
							if (resultQuery.length > 0) {
								var posts = [];
								for (r of resultQuery) {
									var post={
										id: r['id'],
										content: r['content'],
										date: r['date'],
										author: r['author'],
										eventid: r['eventid']
									};
									console.log(post);
									// associate the post to the event
									if (data.events[data.events.length - r['eventid']])
										data.events[data.events.length - r['eventid']].posts.push(post);

								}

							}
						}
									console.log("data1:");
									console.log(data);
									console.log("end");

									// render the html page sent to the client from ejs file
									req.engines['ejs'].renderFile('modules/aqh/body/home.ejs', data, (errorEjs, resultEjs) => {
										if (errorEjs) {
											req.logger.error(errorEjs);
											res.sendStatus(500);
										} else {
											console.log(resultEjs);
											res.send(resultEjs);
										}
									});

				});

			}
		}
	});
};
*/



	/*getPosts = function (i) {
		console.log("pregetPOsts");
		req.database.query("SELECT p.id as id, p.content as content, p.date as date, p.author as author FROM AQHposts AS p JOIN AQHevents AS e ON p.eventid = e.id WHERE e.id=? ORDER BY p.date DESC;",[i] , function (errorQuery, result) {
	console.log("postquery");
			if (errorQuery) {
				console.log("errorgetPosts");
				req.logger.warning(errorQuery);
				res.sendStatus(500);
			} else {

				var data = {
					posts: []
				};
				console.log("result");
				if (result.length > 0) {

					for (let i in result) {
						data.posts.push({
							id: result[i]['id'],
							date: result[i]['date'],
							content: result[i]['content'],
							author: result[i]['author']

						});
					}
				}
				console.log(data);
					return data;*/
			/*	req.engines['ejs'].renderFile('modules/aqh/body/post.ejs', data, (errorEjs, resultEjs) => {
					if (errorEjs) {
						req.logger.error(errorEjs);
						res.sendStatus(500);
					} else {
						console.log(resultEjs);
						res.send(resultEjs);
					}
				});*/
		//	}
//		});
	//};




	//	req.database.query('SELECT * FROM AQHevents;', (error2, result2) => {
//};

//	req.database.query('SELECT e.id as id, e.content as content, e.date as date, u.nick as author, e.title as title FROM (AQHevents AS e JOIN core_user AS u ON u.id = e.author) ORDER BY e.date DESC;', (error2, result2) => {
//};
	//a("testfction");
