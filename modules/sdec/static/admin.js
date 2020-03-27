var newOrders, pendingOrders, waitingOrders, otherOrders;

function loadOrders(ordersList, type) {
	var html = "";
	if (ordersList.length == 0) {
		html += "<p>Aucune commande pour le moment.</p>"
	} else {
		html += "<table id='table_" + type + "' class='table table-sorting table-striped table-hover datatable'>";

		html += "<thead>";
		html += "<tr>";
		html += "<th>Format</th>";
		html += "<th>Quantité</th>";
		html += "<th>Nombre de pages</th>"
		html += "<th>Couleur</th>";
		html += "<th>Recto-verso</th>";
		html += "<th>Prix</th>";
		html += "</tr>";
		html += "</thead>";

		html += "<tbody>";

		k = 0
		Array.prototype.forEach.call(ordersList, function (order) {
			var text_color = order.color ? "Oui" : "Non";
			var text_rv = order.recto_verso ? "Oui" : "Non";
			html += "<tr class='order' id='" + type + "_" + k.toString() + "'>"
			html += "<td>" + order.format + "</td>";
			html += "<td>" + order.quantity + "</td>";
			html += "<td>" + order.pages + "</td>";
			html += "<td>" + text_color + "</td>";
			html += "<td>" + text_rv + "</td>";
			html += "<td>" + order.price.toFixed(2).toString() + "</td>";
			html += "</tr>";

			k += 1;
		});

		html += "</tbody>";
		html += "</table>";
	}

	return html;
};

function loadAllOrders(out1 = 0, out2 = 0, out3 = 0, out4 = 0, in1 = 500, in2 = 500, in3 = 500, in4 = 500) {
	$.get('/module/sdec/getAllOrders', function (res) {
		newOrders = res.new;
		pendingOrders = res.pending;
		waitingOrders = res.waiting;
		otherOrders = res.other;

		$("#newOrders").hide(out1).fadeOut(500).html(loadOrders(res.new, "new", 0)).fadeIn(in1);
		$("#pendingOrders").hide(out2).fadeOut(500).html(loadOrders(res.pending, "pending")).fadeIn(in2);
		$("#waitingOrders").hide(out3).fadeOut(500).html(loadOrders(res.waiting, "waiting")).fadeIn(in3);
		$("#otherOrders").hide(out4).fadeOut(500).html(loadOrders(res.other, "other")).fadeIn(in4);
	});
}

function loadCurrent(type, id) {
	var current;
	switch (type) {
		case 'new':
			current = newOrders[id];
			break;
		case 'pending':
			current = pendingOrders[id];
			break;
		case 'waiting':
			current = waitingOrders[id];
			break;
		case 'other':
			current = otherOrders[id];
			break;
	}

	var html = "<div class='widget'>";
	html += "<div class='widget-header'>";
	html += "<h3><i class='fa fa-bookmark'></i>Commande de " + current.firstname + " " + current.name + "</h3>";
	html += "</div>";
	html += "<div class='widget-content'>";


	var textState;
	switch (current.state) {
		case '0':
			textState = "Pas commencé";
			break;
		case '1':
			textState = "En cours";
			break;
		case '2':
			textState = "Terminé";
			break;
		default:
			textState = "Inconnu";
			break
	}

	html += "<div class='row'>";
	html += "<div class='col-md-6'><i class='fa fa-calendar'></i> " + textState + "</div>";
	html += "</div><br>";

	if (current.file_path != null) {
		html += "<div class='row'>";
		html += "<div class='col-md-12'><a href='/uploads/" + current.file_path + "'>Voir mon document</a></div>";
		html += "</div><br>";
	}

	html += "<div class='row'>"
	html += "<div class='col-md-8'>"

	html += "<div class='row'>";
	if (current.color && current.rectoVerso) {
		html += "<div class='col-md-6'><i class='fa fa-pencil'></i> Couleur</div><div class='col-md-6'><i class='fa fa-files-o'></i> Recto verso</div></p>";
	} else if (current.color) {
		html += "<div class='col-md-6'><i class='fa fa-pencil'></i> Couleur</div><div class='col-md-6'><i class='fa fa-files-o'></i> Recto seul</div></p>";
	} else if (current.rectoVerso) {
		html += "<div class='col-md-6'><i class='fa fa-pencil'></i> Noir et blanc</div><div class='col-md-6'><i class='fa fa-files-o'></i> Recto verso</div></p>";
	} else {
		html += "<div class='col-md-6'><i class='fa fa-pencil'></i> Noir et blanc</div><div class='col-md-6'><i class='fa fa-files-o'></i> Recto seul</div></p>";
	}
	html += "</div>";

	html += "<div class='row'>";
	html += "<div class='col-md-6'><i class='fa fa-list-ol'></i> " + current.quantity.toString() + " exemplaires</div>";
	html += "<div class='col-md-6'><i class='fa fa-file-o'></i> " + current.format + " <i class='fa fa-times'></i> " + current.pages + " pages </div>";
	html += "</div>";

	html += "</div>";

	html += "<div class='col-md-4' id='price_container_2'>";
	html += "<span class='pull-right lead' id='price_value_2'>" + current.price.toFixed(2).toString() + " <i class='fa fa-eur'></i></span>";
	html += "</div>";
	html += "</div>";

	if (current.comment != 0) {
		html += "<div class='row'><div class='col-md-12'><i class='fa fa-comment'></i> " + current.comment + "</div></div>";
	}

	if (current.state == '0') {
		html += "<hr class='dotted-hr inner-separator'>";
		html += "<div class='row'>";
		html += "<div class='col-md-12'>Voir le fichier</div>";
		html += "</div>";

		html += "<div class='row'>";
		html += "<div class='form-group'>";
		html += "<label for='pages' class='col-md-4 control-label'>Nombre de pages</label>";
		html += "<div class='col-md-5'>";
		html += "<input type='text' class='form-control' id='pages' name='pages' value='" + current.pages.toString() + "'>";
		html += "<input type='hidden' name='update_id' id='update_id' value='" + id.toString() + "'/>";
		html += "</div>";
		html += "<div class='col-md-3'>";
		html += "<button type='button' class='btn btn-warning' id='update' name='update'>Modifier</button>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
	}

	html += "<hr class='dotted-hr inner-separator'>";
	html += "<div class='row'>"
	html += "<div class='col-md-12'>Commande passée par " + current.firstname + " " + current.name + "</div>";
	html += "</div>";
	html += "<div class='row'>";
	html += "<div class='col-md-3'><i class='fa fa-user'></i> " + current.nick + "</div>";
	html += "<div class='col-md-9'><i class='fa fa-envelope-o'></i> " + current.email + "</div>";
	html += "</div>";

	html += "<hr class='dotted-hr inner-separator'>";

	switch (type) {
		case 'new':
			html += "<span class='col-md-6'><button class='btn btn-primary topending' id='topending_" + type + "_" + id + "' type='button'>Marquer en cours</button></span>";
			html += "<span class='col-md-6'><button class='btn btn-danger pull-right toother' id='toother_" + type + "_" + id + "' type='button'>Déplacer dans autres</button></span>";
			break;
		case 'pending':
			html += "<span class='col-md-12'><button class='btn btn-success towaiting' id='towaiting_" + type + "_" + id + "' type='button'>Marquer comme terminée</button></span>";
			break;
		case 'waiting':
			html += "<span class='col-md-12'><button class='btn btn-danger todelete' id='todelete_" + type + "_" + id + "' type='button'>Supprimer</button></span>";
			break;
		case 'other':
			html += "<span class='col-md-6'><button class='btn btn-primary topending' id='topending_" + type + "_" + id + "' type='button'>Marquer en cours</button></span>";
			html += "<span class='col-md-6'><button class='btn btn-danger pull-right todelete' id='todelete_" + type + "_" + id + "'type='button'>Refuser la demande</button></span>";
			break
	}
	html += "<br><br>";

	html += "</div>";
	html += "</div>";

	$("#currentOrder").html(html);

	$("#pages").TouchSpin({
		min: 1,
		max: 1000,
		step: 1
	});
}

$(document).ready(function () {
	loadAllOrders();
});

$(document).on('click', '.order', function () {
	var id = this.id;
	var idsplit = id.split("_");
	type = idsplit[0];
	id = idsplit[1];

	loadCurrent(type, id);
});

$(document).on('click', '.topending', function () {
	var id = this.id;
	var splitid = id.split("_");
	var type = splitid[1];
	id = splitid[2];

	var current = (type == 'new') ? newOrders[id] : otherOrders[id];

	$.post('/module/sdec/updateOrder', {
		order_id: current.id,
		state: 1
	}, function () {
		loadAllOrders(0, 0, 0, 0, (type == 'new') ? 500 : 0, 500, 0, (type != 'new') ? 500 : 0);
	});
});

$(document).on('click', '.toother', function () {
	var id = this.id;
	var splitid = id.split("_");
	id = splitid[2];

	var current = newOrders[id];

	$.post('/module/sdec/updateOrder', {
		order_id: current.id,
		state: 3
	}, function () {
		loadAllOrders(0, 0, 0, 0, 500, 0, 0, 500);
	});
});

$(document).on('click', '.towaiting', function () {
	var id = this.id;
	var splitid = id.split("_");
	id = splitid[2];

	var current = pendingOrders[id];

	$.post('/module/sdec/updateOrder', {
		order_id: current.id,
		state: 2
	}, function () {
		loadAllOrders(0, 0, 0, 0, 0, 500, 500, 0);
	});
});

$(document).on('click', '.todelete', function () {
	var id = this.id;
	var splitid = id.split("_");
	var type = splitid[1];
	id = splitid[2];

	var current = (type == 'waiting') ? waitingOrders[id] : otherOrders[id];

	$.post('/module/sdec/deleteOrder', {
		order_id: current.id
	}, function () {
		loadAllOrders(0, 0, 0, 0, 500, 500, 500, 500);
	});
});

function computePrice(quantity, pages, format, rv, color) {
	var blackSinglePrice = [0.8, 0.4, 0.2, 0.1, 0.05, 0.02];
	var colorSinglePrice = [1.6, 0.8, 0.4, 0.2, 0.1, 0.05];
	if (rv) {
		pages = Math.floor(pages / 2) + pages % 2;
	}

	var price;
	if (color) {
		price = quantity * pages * colorSinglePrice[format];
	} else {
		price = quantity * pages * blackSinglePrice[format];
	}
	return price
}

$(document).on('click', '#update', function () {
	var id = $("#update_id").val()
	var pages = $("#pages").val();

	var current = new_orders[id];
	var price = compute_price(current.quantity, pages, parseInt(current.format.substr(1)), current.recto_verso, current.color);

	$.post('/module/sdec/updateOrder', {
		order_id: current.id,
		pages: pages,
		price: price
	});

	loadAllOrders(0, 0, 0, 0, 500, 0, 0, 500);
});