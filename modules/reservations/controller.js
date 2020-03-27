exports.getResourcesReservations = function (req, res) {
	req.database.query("SELECT rr.id AS id, name FROM ResourceReservationBDE AS rr JOIN AuthorisationReservationBDE AS ar ON ar.resource_id = rr.id JOIN core_membership AS cm ON cm.id_group = ar.group_id WHERE cm.id_user = ? ORDER BY id", [req.user.id], (errorResource, resultResource) => {
		if (errorResource) {
			req.logger.error(errorResource);
			res.sendStatus(500);
		} else {
			req.database.query("SELECT r.id AS id, beginning, ending, title, description, user_id, rr.name AS resource_name, rr.id AS resource_id FROM ReservationBDE AS r JOIN ResourceReservationBDE AS rr ON rr.id = r.resource_id WHERE DATE(beginning) >= DATE(?) AND DATE(ending) <= DATE(?);", [new Date(req.query.start), new Date(req.query.end)], (errorReservation, resultReservation) => {
				if (errorReservation) {
					req.logger.error(errorReservation);
					res.sendStatus(500);
				} else {
					res.json({
						reservations: resultReservation,
						resources: resultResource,
						user_id: req.user.id
					});
				}
			});
		}
	});
};

exports.addReservation = function (req, res) {
	req.database.query("INSERT INTO ReservationBDE (beginning, ending, title, resource_id, description, user_id) VALUES (?,?,?,?,?,?)", [req.body.beginning, req.body.ending, req.body.title, req.body.resource, req.body.description, req.user.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200)
		}
	});
};

exports.updateReservation = function (req, res) {
	req.database.query("UPDATE ReservationBDE SET beginning=?, ending=?, title=?, description=? WHERE id=? AND user_id=?;", [req.body.beginning, req.body.ending, req.body.title, req.body.description, req.body.id, req.user.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200)
		}
	});
};

exports.deleteReservation = function (req, res) {
	req.database.query("DELETE FROM ReservationBDE WHERE id=? AND user_id=?;", [req.body.id, req.user.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200)
		}
	});
};