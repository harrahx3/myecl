const xss = require("xss"); // Protect against Cross-site scripting
const webPush = require('web-push'); // Send Push notifications
//subscriptions = [];
const publicVapidKey = "BH3iIFAa05KHsYCDND5vXpa_MqRALURmWGpRX3dg5lBaxS6WQXEzJdhda3_dNAoKR3OD8txdiM2Op9mv-71eXPs";
const privateVapidKey = "RXWqNvNVXov5HWdrxlM-dLG9TyBkYsStahQhiWLrrr0";
webPush.setVapidDetails('mailto:hyacinthemen@gmail.com', publicVapidKey, privateVapidKey);

//console.log(xss.whiteList);

/*var h = '<img src="/myimg/img.png" alt="abc"><p>gras</p><script>alert("xss");</script>';
console.log(h);
h = xss(h);
console.log(h);*/



exports.subscribe = function(req, res){
	console.log("add sub");
	req.database.query('SELECT * FROM pushSubscriptions WHERE sub=?;', [req.body.content], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			if (!result.length) {
				req.database.query('INSERT INTO pushSubscriptions (sub) VALUES (?);', [req.body.content], (error2, result2) => {
					if (error2) {
						req.logger.error(error2);
					} else {
						res.sendStatus(200);
					}
				});
			}
		}
	});
};

exports.broadcast_notif = function(req, res){
	console.log("broadcast_notif");
	req.database.query('SELECT * FROM pushSubscriptions;', [], (error, result) => {
		console.log(result.length);
		if (error) {
			req.logger.error(error);
		} else {
			const payload = JSON.stringify({
				title: req.body.title
			});
			for (var i = 0; i < result.length; i++) {
				console.log("send");
				webPush.sendNotification(JSON.parse(result[i].sub), payload)
					.catch(err => console.error(err));
			}
			res.sendStatus(200);
		}
	});
};

 function broadcastPushotif(req, res, msg){
	console.log("broadcastPushotif");
	req.database.query('SELECT * FROM pushSubscriptions;', [], (error, result) => {
		console.log(result.length);
		if (error) {
			req.logger.error(error);
		} else {
			const payload = JSON.stringify({
				title: msg
			});
			for (var i = 0; i < result.length; i++) {
				console.log("send");
				webPush.sendNotification(JSON.parse(result[i].sub), payload)
					.catch(err => console.error(err));
			}
		//	res.sendStatus(200);
		}
	});
};


exports.addComment = function (req, res) {
	console.log("addComment");
	req.database.query('INSERT INTO AQHcomments (content, date, author, postid) VALUES (?, NOW(), ?, ?);', [req.body.content, req.user.id, req.body.postid], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			broadcastPushotif(req, res, req.user.id+"a commenté un post sur AQH");
			res.sendStatus(200);
		}
	});
}


// Pour avoir les données (nottament les assos) de l'utilisateur connecté
loadUserData = async function (req, res) {
	return new Promise((resolve, reject) => {

	//	var updated = false;

		var	id = req.user.id;
		console.log(id);

		req.database.query("SELECT id, login, name, firstname, nick, DATE_FORMAT(birth, '%d/%m/%Y') AS birth, promo, floor, email, picture, online, DATE_FORMAT(last_seen, '%d/%m/%Y') AS last_seen_date, DATE_FORMAT(last_seen, '%H:%i') AS last_seen_hour FROM core_user WHERE id = ?", [id], function (error, result) {
			if (error) {
				req.logger.warning(error);
				res.sendStatus(500);
			} else {
				if (result.length) {
					var data = new Object();
					data.found = true;
				//	data.updated = updated;
					data.isCurentUser = id == req.user.id;
					data.id = id;
					for (let entry in result[0])
						if (entry != 'password')
							data[entry] = result[0][entry]

					data.assos = new Array();
					var promises = new Array();
					req.database.query("SELECT u.name AS name, u.description AS description, m.position AS position FROM core_membership AS m JOIN core_group AS u ON m.id_group = u.id WHERE m.id_user = ?", [id], function (err2, result2) {
						if (err2) {
							req.logger.warning(error);
							res.sendStatus(500);
						} else {
							if (result2.length) {
								for (let i in result2) {
									promises.push(new Promise(function (resolve) {
										data.assos.push({
											'name': result2[i]['name'],
											'description': result2[i]['description'],
											'position': result2[i]['position']
										});
										resolve();
									}));
								}
								Promise.all(promises).then(function () {
									resolve(data);
								})
							}
						}
					});

				} else {
					var data = new Object();
					data.found = false;
					resolve(data);
				}
			}
		})
	});
};

loadEventsData = async function (req, res) {
	return new Promise((resolve, reject) => {
		req.database.query("SET lc_time_names = 'fr_FR';", (errorl, resultl) => { // Pour tenter de formater les dates en francais

		//get all events
	//	req.database.query('SELECT e.id as id, e.description as content, e.start as date, e.organisationid as author, e.title as title FROM BDECalendar AS e ORDER BY e.start DESC;', (error, result) => {
			req.database.query('SELECT t.id as id, t.content as content, t.location as location, DATE_FORMAT(t.date, "%W %D %b %Y") as date, DATE_FORMAT(t.start, "%W %D %b %Y") as start, DATE_FORMAT(t.end, "%W %D %b %Y") as end, t.organisationid as author, t.title as title, t.id_user as miduser, g.name AS organisateur FROM (SELECT e.id as id, e.description as content, e.start as date, e.start as start, e.end as end, e.organisationid as organisationid, e.title as title, e.location as location, m.id_user as id_user FROM BDECalendar AS e JOIN core_membership AS m ON e.organisationid=m.id_group) AS t JOIN core_group AS g ON t.organisationid=g.id ORDER BY date DESC;', (error, result) => {

				if (error) {
					req.logger.error(error);
					res.sendStatus(500);
				} else {
					var data = {
						events: []
					};

					if (result.length) {
						for (let i in result) {
							var admin = (result[i]['miduser'] == req.user.id);
							var event={
								id: result[i]['id'],
								date: result[i]['date'],
								title: xss(result[i]['title']),
								content: (result[i]['content']),
								author: xss(result[i]['author']),
								admin: admin,
								organisateur: xss(result[i]['organisateur']),
								start: result[i]['start'],
								end: result[i]['end'],
								location: result[i]['location'],
								posts: []
							};

							var add=true;
							for (var j in data.events) {
								// is the current user an admin for the current event
								 if (data.events[j].id==event.id) {
									add=false;
									if (!data.events[j].admin && admin) {
										data.events[j].admin=true;
									}
								}
							}
							if (add)
								data.events.push(event);
						}

						if (user_data.isAdminOrBde) // BDE ans site administrators are admins on every events
							for (var i = 0; i < data.events.length; i++)
								data.events[i].admin = true;

						//get all the comments
						var comments = [];
						req.database.query('SELECT c.id as id, c.content as content, DATE_FORMAT(c.date, "%D %b") as date, u.nick as author, u.id as author_id, c.postid as postid, u.picture as author_avatar FROM AQHcomments AS c JOIN core_user AS u ON c.author=u.id ORDER BY c.date ASC;', (errorC, resultC) => {
							if (errorC) {
								req.logger.error(errorC);
								res.sendStatus(500);
							} else {
								if (resultC.length) {
									for (c of resultC) {
										comments.push({
											id: c['id'],
											content: xss(c['content']),
											date: c['date'],
											author: {id: xss(c['author_id']), name: xss(c['author']), avatar: xss(c['author_avatar'])},
											postid: c['postid']
										});
									}
								}
							}

							// get all posts
							req.database.query('SELECT p.id as id, p.content as content, p.validated as validated, DATE_FORMAT(p.date, "%W %D %b %Y") as date, u.nick as author, u.picture as author_avatar, u.id as author_id, p.eventid as eventid FROM AQHposts AS p JOIN core_user AS u ON p.author=u.id ORDER BY p.date DESC;', (errorQuery, resultQuery) => {
								if (errorQuery) {
									req.logger.error(errorQuery);
									res.sendStatus(500);
								} else {
									if (resultQuery.length) {
										var posts = [];
										for (r of resultQuery) {
											var post={
												id: r['id'],
												content: (r['content']),
												date: r['date'],
												author: {id: xss(r['author_id']), name: xss(r['author']), avatar: xss(r['author_avatar'])},
												eventid: r['eventid'],
												validated: r['validated'],
												comments: []
											};

											// associate comments to the post
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
										resolve(data);
								});
						});
					}
				}
			});
		});
	});
}



 exports.getAllEvents = async function (req, res) {
	 // interroge la base de données pour créer un grand objet data qui contient les détails des événements et envoie un fichier html généré avec le template home.ejs
	console.log("getAllEvents begin");

	let promise_user_data = loadUserData(req, res);
	user_data = await promise_user_data; // met en pause le temps d'obtenir les infos de l'utilisateur

	user_data.isAdminOrBde = false; // Les groupes admin et bde ont des droits spécifiques (admins de tous les événements et validation des posts)
	for (var i = 0; i < user_data.assos.length; i++)
		user_data.isAdminOrBde = user_data.isAdminOrBde || user_data.assos[i].name=='admin' || user_data.assos[i].name=='bde';

	// Il faut absolument utiliser les promesses sinon le code continue et 'data' est vide au moment de générer le ejs
	let promise = loadEventsData(req, res); // grande fonction lente avec plusieurs appels à la base de données
	let data = await promise; // wait until the promise resolves (*)

	data["user"]=user_data;
	console.log(data);

	// render the html page sent to the client from ejs file
	req.engines['ejs'].renderFile('modules/aqh/body/home.ejs', data, (errorEjs, resultEjs) => {
		if (errorEjs) {
			req.logger.error(errorEjs);
			res.sendStatus(500);
		} else {
			console.log("getAllEvents send");
			res.send(resultEjs);
		}
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

/*exports.getAll = function (req, res) {
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
};*/

/*exports.getAllFrom = function (req, res) {
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
};*/


exports.addPost = function (req, res) {
	var xss = require("xss");
	console.log("addPost");
	req.database.query('INSERT INTO AQHposts (content, date, author, eventid) VALUES (?, NOW(), ?, ?);', [(req.body.content), xss(req.user.id), xss(req.body.eventid)], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			broadcastPushotif(req, res, req.user.id+"a posté sur AQH");
			res.sendStatus(200);
		}
	});
};

exports.update = function (req, res) {
	var xss = require("xss");
	console.log("update");
	req.database.query('UPDATE AQHposts SET content = ? WHERE id = ?;', [(req.body.content), xss(req.body.id)], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

var delPost = function (req, res) {
	console.log("delete post");
	req.database.query('DELETE FROM AQHcomments WHERE postid = ?', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		}
		else {
			req.database.query('DELETE FROM AQHposts WHERE id = ?;', [req.body.id], (error, result) => {
				if (error) {
					req.logger.error(error);
				} else {
					return;
				}
			});
		}
	});
};

exports.deletePost = function (req, res) {
	console.log("delete post");
	delPost(req, res);
	res.sendStatus(200);
};

exports.deleteComment = function (req, res) {
	console.log("delete comment");
	req.database.query('DELETE FROM AQHcomments WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

/*
exports.subscribe = function (req, res) {
	console.log("subscribe");

	subscription = req.body.content;
	console.log(subscription);
	subscriptions.push(subscription);

	res.sendStatus(200);

	console.log("/n subscriptions: /n");
	console.log(subscriptions);

};
*/
/*
exports.broadcast_notif = function (req, res) {
	console.log("broadcast received");

	res.sendStatus(200);

	console.log("/n subscriptions: /n");
	console.log(subscriptions);

	const payload = JSON.stringify({
    title: 'BROADCAST Push notifications with Service Workers !!!',
  });

  for (var i = 0; i < subscriptions.length; i++) {
    webPush.sendNotification(JSON.parse(subscriptions[i]), payload)
      .catch(error => console.error(error));
  }


};
*/
exports.validatePost = function(req, res){
	console.log("validatePost");
	req.database.query('UPDATE AQHposts SET validated=true WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

/*exports.getALLData = function (req, res) {
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
};*/

/*exports.getComments = function (req, res) {
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
};*/

/*exports.getPostComments = function (req, res) {
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
};*/


/*exports.getPostsForEvent = function (req, res) {
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
};*/


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
