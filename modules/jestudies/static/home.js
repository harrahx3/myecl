$(document).ready(function () {
	loadStudies();
});

function loadStudies() {
	$.get("/module/jestudies/getAll", function (result) {
		html = "";

		if (result.studies.length > 0) {
			for (let i in result.studies) {
				html += "<div class='study align-" + (i % 2).toString() + "'>";
				html += "<span class='study-title'>" + result.studies[i].title + "</span>";
				html += "<span class='study-description'>" + result.studies[i].description + "</span>";

				html += "<hr class='study-hr'>";

				html += "<span class='study-number'>";
				if (result.studies[i].appliantsNumber == 0) {
					html += "Pas encore d'intéressé";
				} else if (result.studies[i].appliantsNumber == 1) {
					html += "1 intéressé";
				} else {
					html += result.studies[i].appliantsNumber + " intéressés";
				}
				html += "</span>";
				html += "<br>";

				if (result.studies[i].isIn) {
					html += "<span class='study-operation study-quit'>";
					html += "<button class='btn btn-warning quit' id='" + result.studies[i].id + "'>Plus intéressé</button>"
					html += "</span>";
				} else {
					html += "<span class='study-operation study-apply'>";
					html += "<button class='btn btn-primary apply' id='" + result.studies[i].id + "'>Intéressé</button>"
					html += "</span>";
				}
				html += "</div>";
			}
		} else {
			html += "<p>Aucune offre n'est disponible pour l'instant.</p>";
		}

		$("#availableOffers").html(html);
	});
}

$(document).on('click', '.apply', function () {
	$.post('/module/jestudies/apply', {
		id: $(this).attr('id')
	}, function (result) {
		relocate('internal', 'jestudies', 'home');
	});
});

$(document).on('click', '.quit', function () {
	$.post('/module/jestudies/quit', {
		id: $(this).attr('id')
	}, function (result) {
		relocate('internal', 'jestudies', 'home');
	});
});