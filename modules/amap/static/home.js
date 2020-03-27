$(document).ready(function () {
	loadSelect();
	$("#amount").hide();
	$("#order").hide();
})

function loadSelect() {
	$.get('/module/amap/getWeeks', function (data) {
		var html = "";
		html += "<select name='weekId' id='weekId'>";
		html += "<option value='0' selected>Choisir une semaine</option>";
		for (let i in data) {
			var date = data[i];
			html += "<option value='" + date.id + "'>" + date.start + "</option>";
		}
		html += "</select>";
		$("#selectWeek").html(html);
	});
}

$(document).on('change', '#weekId', function () {
	loadOrders();
});

function loadOrders() {
	$.get('/module/amap/getAccount', {
		week: $("#weekId").val()
	}, function (data) {
		var cash = data.cash;
		$("#amountLeft").html(cash.toFixed(2));
		$("#amount").show();

		var products = data.products;
		var html = "";
		html += "<table class='table'>";
		html += "<thead><tr>";
		html += "<th>Article</th>";
		html += "<th>Prix unitaire</th>";
		html += "<th>Quantité</th>";
		html += "<th>Prix total</th>";
		html += "</tr></thead>";
		html += "<tbody>";
		for (let i in products) {
			var product = products[i];
			html += "<tr>";
			html += "<td>" + product.name + "</td>";
			html += "<td>" + product.price.toFixed(2) + "</td>";
			html += "<td><input class='form-control small-input' type='text' name='product_" + product.id + "' id='product_" + product.id + "' value='" + product.quantity + "'/></td>";
			html += "<td>" + (product.quantity * product.price).toFixed(2) + "</td>";
			html += "</tr>";
		}
		html += "</tbody>";
		html += "</table>";

		html += "<button class='btn btn-primary' id='validOrder'>Valider la commande</button>";
		$("#listOrders").html(html);
		loadPrice();
	});
}

$(document).on('click', '#validOrder', function () {
	var week = $("#weekId").val();
	var products = {};
	$(".small-input").each(function () {
		if (parseInt($(this).val()) > 0) {
			var id = $(this).attr('id').split('_')[1];
			products[id] = $(this).val();
		}
	});

	$.post('/module/amap/updateOrder', {
		week: week,
		products: JSON.stringify(products)
	}, function () {
		relocate('internal', 'amap', 'home');
	});
});

function loadPrice() {
	var products = {};
	$(".small-input").each(function () {
		if (parseInt($(this).val()) > 0) {
			var id = $(this).attr('id').split('_')[1];
			products[id] = $(this).val();
		}
	});

	$.get('/module/amap/computePrice', {
		products: JSON.stringify(products)
	}, function (data) {
		$("#amountOrder").html(data.price.toFixed(2));
		$("#order").fadeIn();
	})
}

$(document).on('change', '.small-input', function () {
	var products = {};
	loadPrice();
});