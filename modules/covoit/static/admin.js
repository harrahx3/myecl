$(document).ready(function () {
	$('.summernote').summernote({
		height: 150,
		toolbar: [
			['style', ['bold', 'italic', 'underline', 'clear']],
			['color', ['color']],
			['para', ['ul', 'ol', 'paragraph']]
		]
	});
	$("#message").hide();
	loadStudies();
});

$("#addOffer").click(function (e) {
	e.preventDefault();
	$.post("/module/jestudies/add", {
		title: $("#offerTitle").val(),
		description: $("#offerDescription").code(),
		appliants: JSON.stringify({
			"ids": []
		})
	}, function () {
		relocate('internal', 'jestudies', 'admin');
	});
});

function loadStudies() {
	$.get('/module/jestudies/getAllAdmin', (result) => {
		var html = "";
		html += "<table class='table'>";
		html += "<thead>";
		html += "<tr>";
		html += "<th>Titre</th>";
		html += "<th>Description</th>";
		html += "<th>Intéressés</th>";
		html += "<th>Opération</th>";
		html += "</tr>";
		html += "</thead>";
		html += "<tbody>";
		for (let i in result.studies) {
			var id = result.studies[i].id;
			var title = result.studies[i].title;
			var description = result.studies[i].description;
			var students = result.studies[i].students;
			html += "<tr>";
			html += "<td width='10%' id='title_" + id + "'>" + title + "</td>";
			html += "<td width='40%' id='description_" + id + "'>" + description + "</td>";

			html += "<td>";
			if (students.length > 0) {
				for (let j in students) {
					html += students[j].firstname + " " + students[j].name;
					html += " - " + students[j].nick;
					html += "<br>";
				}
			} else {
				html += "Pas encore d'intéressé";
			}
			html += "</td>";

			html += "<td>"
			html += "<button class='btn btn-danger deleteOffer' id = '" + id + "' type = 'button' > Retirer</button><br><br>";
			html += "<button class='btn btn-warning selectOffer' id='" + id + "' type='button'>Modifier</button>";
			html += "</td>";
			html += "</tr>";
		}
		html += "</tbody>";
		html += "</table>";
		$("#currentOffers").html(html);
	});
}

$(document).on('click', '.selectOffer', function () {
	var id = $(this).attr('id');
	$("#offerTitle").val($("#title_" + id).html());
	$("#offerDescription").code($("#description_" + id).html());
	$("#offerId").val(id);
	$("#controls").html("<button type='button' id='cancel' class='btn btn-danger pull-left'>Annuler</button><button type='button' id='updateOffer' class='btn btn-success pull-right'>Éditer</button>");
});

$(document).on('click', '#updateOffer', function () {
	$.post('/module/jestudies/update', {
		id: $("#offerId").val(),
		title: $("#offerTitle").val(),
		description: $("#offerDescription").code()
	}, function () {
		relocate('internal', 'jestudies', 'admin');
	});
});

$(document).on('click', '#cancel', function () {
	var id = $(this).attr('id');
	$("#offerTitle").val("");
	$("#offerDescription").code("");
	$("#controls").html("<button type='button' id='addOffer' class='btn btn-primary pull-center'>Ajouter</button>");
});

$(document).on('click', '.deleteOffer', function () {
	$.post("/module/jestudies/delete", {
		id: $(this).attr('id')
	}, function () {
		relocate('internal', 'jestudies', 'admin');
	});
});