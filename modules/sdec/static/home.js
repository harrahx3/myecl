$("#quantity").TouchSpin({
	min: 1,
	max: 1000,
	step: 1
});

$("#pages").TouchSpin({
	min: 1,
	max: 1000,
	step: 1
});

function loadMyOrders() {
	$.get('/module/sdec/getUserOrders', function (res) {
		if (res.list.length == 0) {
			$("#myOrders").html("<p>Aucune commande active pour le moment.</p>");
		} else {
			var toAppend = "<div class='panel-group' id='accordion'>";

			var k = 0;
			Array.prototype.forEach.call(res.list, function (order) {
				k += 1;
				dbId.push(order.id);

				var textState;
				switch (order.state) {
					case '0':
						textState = "Pas commencé</div><div class='col-md-6'><span class='pull-right'><i class='fas fa-trash'></i> <a href='#' class='delete' id='delete" + k.toString() + "'>Annuler</a></span>";
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

				toAppend += "<div class='panel panel-default' id='order" + k.toString() + "'>";
				toAppend += "<div class='panel-heading'>";
				toAppend += "<h4 class='panel-title'>"
				toAppend += "<a data-toggle='collapse' data-parent='#accordion' href='#accordion" + k.toString() + "' id='link" + k.toString() + "'>Commande " + k.toString() + " <i class='fas fa-angle-down pull-right'></i><i class='fas fa-angle-up pull-right'></i></a>";
				toAppend += "</h4>";
				toAppend += "</div>";
				if (k == 1) {
					toAppend += "<div id='accordion" + k.toString() + "' class='panel-collapse collapse in'>";
				} else {
					toAppend += "<div id='accordion" + k.toString() + "' class='panel-collapse collapse'>";
				}

				toAppend += "<div class='panel-body'>";

				toAppend += "<div class='row'>";
				toAppend += "<div class='col-md-6'><i class='fas fa-calendar'></i> " + textState + "</div>";
				toAppend += "</div><br>";

				if (order.file_path != null) {
					toAppend += "<div class='row'>";
					toAppend += "<div class='col-md-12'><a href='/uploads/" + order.file_path + "'>Voir mon document</a></div>";
					toAppend += "</div><br>";
				}

				toAppend += "<div class='row'>"
				toAppend += "<div class='col-md-8'>"

				toAppend += "<div class='row'>";
				if (order.color && order.rectoVerso) {
					toAppend += "<div class='col-md-6'><i class='fas fa-pencil'></i> Couleur</div><div class='col-md-6'><i class='fas fa-files-o'></i> Recto verso</div></p>";
				} else if (order.color) {
					toAppend += "<div class='col-md-6'><i class='fas fa-pencil'></i> Couleur</div><div class='col-md-6'><i class='fas fa-files-o'></i> Recto seul</div></p>";
				} else if (order.rectoVerso) {
					toAppend += "<div class='col-md-6'><i class='fas fa-pencil'></i> Noir et blanc</div><div class='col-md-6'><i class='fas fa-files-o'></i> Recto verso</div></p>";
				} else {
					toAppend += "<div class='col-md-6'><i class='fas fa-pencil'></i> Noir et blanc</div><div class='col-md-6'><i class='fas fa-files-o'></i> Recto seul</div></p>";
				}
				toAppend += "</div>";

				toAppend += "<div class='row'>";
				toAppend += "<div class='col-md-6'><i class='fas fa-list-ol'></i> " + order.quantity.toString() + " exemplaires</div>";
				toAppend += "<div class='col-md-6'><i class='fas fa-file-o'></i> " + order.format + " <i class='fas fa-times'></i> " + order.pages + " pages </div>";
				toAppend += "</div>";

				toAppend += "</div>";

				toAppend += "<div class='col-md-4' id='priceContainer2'>";
				toAppend += "<span class='pull-right lead' id='priceValue2'>" + order.price.toFixed(2).toString() + " <i class='fas fa-eur'></i></span>";
				toAppend += "</div>";
				toAppend += "</div>";

				if (order.comment != 0) {
					toAppend += "<div class='row'><div class='col-md-12'><i class='fas fa-comment'></i> " + order.comment + "</div></div>";
				}

				toAppend += "</div>";
				toAppend += "</div>";
				toAppend += "</div>";
			});

			toAppend += "</div>";
			$("#myOrders").hide().html(toAppend).fadeIn(500);
		}
	});
}

function computePrice() {
	var quantity = parseInt($("#quantity").val());
	var pages = parseInt($("#pages").val());
	var format = ($("#format").val() != "default") ? parseInt($("#format").val().substr(1)) : -1;
	var rv = $("#rectoVerso").prop('checked');
	var color = $("#color").prop('checked');

	var blackSinglePrice = [0.8, 0.4, 0.2, 0.1, 0.05, 0.02];
	var colorSinglePrice = [1.6, 0.8, 0.4, 0.2, 0.1, 0.05];

	if (quantity > 0 && pages > 0 && format >= 0) {
		if (rv) {
			pages = Math.floor(pages / 2) + pages % 2;
		}

		var price;
		if (color) {
			price = quantity * pages * colorSinglePrice[format];
		} else {
			price = quantity * pages * blackSinglePrice[format];
		}

		$("#priceValue").html("Prix : " + price.toFixed(2).toString() + " <i class='fas fa-eur'></i>");
		$("#price").val(price.toFixed(2));
	} else {
		$("#priceValue").html("Prix : 0.00 <i class='fas fa-eur'></i>");
		$("#price").val(0.00);
	}
}

var dbId = [];
$(document).ready(function () {
	loadMyOrders();
});

$(document).on('click', '.delete', function () {
	var id = this.id;
	var k = parseInt(id.substr(6));
	order_id = dbId[k - 1];

	$.post('/module/sdec/deleteOrder', {
		order_id: order_id
	}, function () {
		loadMyOrders();
	});
});

$("#quantity").change(function () {
	computePrice();
});

$("#pages").change(function () {
	computePrice();
});

$("#format").change(function () {
	computePrice();
});

$("#color").change(function () {
	computePrice();
});

$("#rectoVerso").change(function () {
	computePrice();
});