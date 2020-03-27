var productsNames = {};
$(document).ready(function () {
	loadWeeks();
	loadProducts();
	loadSelect();

	$.get("/module/amap/getProducts", function (data) {
		for (let i in data) {
			productsNames[data[i].id] = {
				name: data[i].name,
				price: data[i].price,
				quantity: 0
			};
		}
	});
});

function loadWeeks() {
	$.get('/module/amap/getWeeks', function (res) {
		var html = "";
		html += "<table class='table'>";
		html += "<thead><tr>";
		html += "<th>Début</th>";
		html += "<th>Fin</th>";
		html += "<th></th>";
		html += "</tr></thead>";
		html += "<tbody>";
		for (let i in res) {
			html += "<tr>";
			var start = res[i].start.replace('.', '/').replace('.', '/');
			var end = res[i].end.replace('.', '/').replace('.', '/');

			html += "<td>" + start + "</td>";
			html += "<td>" + end + "</td>";
			html += "<td><button class='btn btn-danger removeWeek' type='button' id='" + res[i].id + "'>Supprimer</button></td>";
			html += "</tr>";
		}
		html += "</tbody>";
		html += "</table>";
		$("#listWeeks").html(html);
	});
}

$(document).on('click', '#addWeek', function (e) {
	e.preventDefault();
	$.post('/module/amap/toggleWeek', {
		start: $("#start").val(),
		end: $("#end").val()
	}, function (res) {
		$("#start").val("");
		$("#end").val("");
		loadWeeks();
	});
});

$(document).on('click', '.removeWeek', function () {
	var id = $(this).attr('id');
	$.post('/module/amap/toggleWeek', {
		id: id
	}, function (res) {
		loadWeeks();
	})
});

function loadProducts() {
	$.get('/module/amap/getProducts', function (res) {
		var html = "";
		html += "<table class='table'>";
		html += "<thead><tr>";
		html += "<th>Nom</th>";
		html += "<th>Prix</th>";
		html += "<th></th>";
		html += "</tr></thead>";
		html += "<tbody>";
		for (let i in res) {
			html += "<tr>";

			html += "<td>" + res[i].name + "</td>";
			html += "<td>" + res[i].price + "</td>";
			html += "<td><button class='btn btn-danger removeProduct' type='button' id='" + res[i].id + "'>Supprimer</button></td>";
			html += "</tr>";
		}
		html += "</tbody>";
		html += "</table>";
		$("#listProducts").html(html);
	});
}

$(document).on('click', '#addProduct', function (e) {
	e.preventDefault();
	$.post('/module/amap/addProduct', {
		name: $("#name").val(),
		price: $("#price").val()
	}, function (res) {
		$("#name").val("");
		$("#price").val("");
		loadProducts();
	});
});

$(document).on('click', ".removeProduct", function () {
	var id = $(this).attr('id');
	$.post('/module/amap/removeProduct', {
		id: id
	}, function () {
		loadProducts();
	});
});

$("#search").keyup(updateSearch);

function updateSearch() {
	$.get('/module/amap/searchUser', {
		name: $("#search").val()
	}, function (res) {
		var html = "";
		html += "<table class='table'>";
		html += "<thead><tr>";
		html += "<th>Nom</th>";
		html += "<th>Surnom</th>";
		html += "<th>Solde</th>";
		html += "<th></th>";
		html += "</tr></thead>";
		html += "<tbody>";

		res = JSON.parse(res);

		var promises = [];
		for (let i in res.byNick) {
			promises.push(new Promise((resolve) => {
				var user = res.byNick[i];
				$.get('/module/amap/getCash', {
					id: user.id
				}, function (data) {
					html += "<tr>";
					html += "<td>" + user.name + " " + user.firstname + "</td>";
					html += "<td>" + user.nick + "</td>";
					html += "<td>" + data.cash + "</td>";
					html += "<td><a class='updateCash btn btn-custom-secondary' id='" + user.id + "' class='btn btn-custom-secondary'>Mettre à jour</a></td>";
					html += "</tr>";
					resolve();
				});
			}));
		}

		Promise.all(promises).then(function () {
			html += "</tbody>";
			html += "</table>";
			$("#foundMembers").html(html);
		});
	});
}

$(document).on('click', '.updateCash', function () {
	$.post('/module/amap/updateCash', {
		id: $(this).attr('id'),
		amount: $("#amount").val()
	}, function () {
		updateSearch();
	});
});

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
	$.get('/module/amap/getAllOrders', {
		week: $("#weekId").val()
	}, function (data) {
		var total = {};
		// DETAIL
		var html = "";
		html += "<table class='table'>";
		html += "<thead><tr>";
		html += "<th>Nom</th>";
		html += "<th>Commande</th>";
		html += "<th>Prix</th>";
		html += "</tr></thead>";
		html += "<tbody>";
		if (data.length) {
			for (let i in data) {
				html += "<tr>";
				html += "<td>" + data[i].name + " " + data[i].firstname + "</td>";
				html += "<td><ul>";
				for (let j in data[i].products) {
					html += "<li>" + productsNames[j].name + " x " + data[i].products[j] + "</li>";

					if (total.hasOwnProperty(j)) {
						total[j].quantity += parseInt(data[i].products[j]);
					} else {
						total[j] = {
							name: productsNames[j].name,
							quantity: parseInt(data[i].products[j])
						}
					}
				}
				html += "</ul></td>";
				html += "<td>" + data[i].price + "</td>";
				html += "</tr>";
			}
			html += "</tbody>";
			html += "</table>";
			$("#listOrders").html(html);

			// RESUME
			var html = "";
			html += "<table class='table'>";
			html += "<thead><tr>";
			html += "<th>Article</th>";
			html += "<th>Quantité</th>";
			html += "</tr></thead>";
			html += "<tbody>";
			for (let i in total) {
				if (total[i].quantity > 0) {
					html += "<tr>";
					html += "<td>" + total[i].name + "</td>";
					html += "<td>" + total[i].quantity + "</td>";
					html += "</tr>";
				}
			}
			html += "</tbody>";
			html += "</table>";
			$("#summary").html(html);

		} else {
			html = "Pas encore de commande pour cette semaine";
			$("#listOrders").html(html);
			$("#summary").html(html);
		}
	});
}