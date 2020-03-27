exports.mid = (req, res, next) => {
	req.mlkjmk = 3;
	next();
}

exports.test = (req, res) => {
	res.render('file.ejs', {
		params: req.mlkjmk
	});
}

// static - internal +++
// static - external +++
// static - tile ???

// callback - internal +++
// callback - external +++
// callback - tile ???

// middleware - internal +++
// middleware - external +++
// middleware - tile ???