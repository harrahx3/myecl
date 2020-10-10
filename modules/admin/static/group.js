$('#updateGroup').click(function () {
	// enregistre sur le serveur le nom et la description d'un groupe
	$.post('/module/admin/updateGroup', {
		id: $('#groupId')[0].value,
		description: $('#inputDescription')[0].value
	}, function () {
		relocate('internal', 'admin', 'group/' + $('#groupId')[0].value);
	});
});

$('#deleteGroup').click(function () {
	// supprime un groupe sur le serveur
	if (!confirm('Attention vous allez supprimer un groupe !')) {
		return;
	}
	$.post('/module/admin/deleteGroup', {
		id: $('#groupId')[0].value
	}, function () {
		relocate('internal', 'admin', 'home');
	});
});

$("#search").keyup(function () {
	$.get('/module/admin/searchUser', {
		s: $("#search").val()
	}, (data) => {
		let parsed = JSON.parse(data);
		let byNick = parsed.byNick;
		let byName = parsed.byName;
		let byFloor = parsed.byFloor;
		let byBirth = parsed.byBirth;

		var tables = [byNick, byName, byFloor, byBirth];
		var titles = ["surnom", "nom/prénom", "étage", "date de naissance"];

		var count = 0;
		var html = "<table class='table table-condensed tabl-dark-header'>";
		html += "<thead><tr>";
		html += "<th>Nom</th>";
		html += "<th>Surnom</th>";
		html += "<th></th>";
		html += "</tr></thead>";
		html += "<tbody>";
		for (let i = 0; i < tables.length; i++) {
			if (tables[i].length) {
				html += "<tr><td colspan='3' align='center'><span class='intertitle'>Par " + titles[i] + "</span></td></tr>";
				for (let j in tables[i]) {
					html += "<tr>";
					html += "<td>" + tables[i][j].firstname + " " + tables[i][j].name + "</td>";
					html += "<td>" + tables[i][j].nick + "</td>";
					html += "<td><a class='addMember btn btn-custom-secondary btn-xs' id='" + tables[i][j].id + "'>Ajouter</a></td>";
					html += "</tr>";
					count++;
				}
			}
		}
		html += "</tbody>";
		html += "</table>";

		if (count == 0) {
			html = "La recherche ne correspond à aucun résultat.";
		}
		html = "<br><br><br>" + html;

		$("#results").html(html);
	});
});

$(document).on('click', '.addMember', function () {
	console.log($("#isVPCom"));
	console.log($("#isVPCom")[0].checked);
	$.post('/module/admin/addMember', {
		idGroup: $('#groupId')[0].value,
		idUser: $(this).attr('id'),
		position: $("#position").val(),
		term: $("#term").val(),
		isVPCom: $("#isVPCom")[0].checked
	}, function (result) {
		if (result.success == -2) {
			$("#error").html("<br><br><br>Erreur lors de l'ajout : le groupe n'a pas été trouvé");
		} else if (result.success == -1) {
			$("#error").html("<br><br><br>Erreur lors de l'ajout : l'utilisateur n'a pas été trouvé");
		} else if (result.success == 0) {
			$("#error").html("<br><br><br>Erreur lors de l'ajout : l'utilisateur est déjà dans le groupe");
		} else if (result.success == 1) {
			relocate('internal', 'admin', 'group/' + $('#groupId')[0].value);
		}
	});
});

$('.removeMember').click(function () {
	// retire un utilisateur de la liste des membres
	$.post('/module/admin/removeMember/', {
		idGroup: $('#groupId')[0].value,
		idUser: $(this).attr('id')
	}, function () {
		relocate('internal', 'admin', 'group/' + $('#groupId')[0].value);
	});
});
