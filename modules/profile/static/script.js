// PARTIE SUPPRESSION IMAGE

$("#delete_picture").click(function () {
	$.post('/module/profile/deleteImage', function (res) {
		relocate('internal', 'profile', 'profile/-2');
	});
});

// PARTIE CHANGEMENT IMAGE

function readFile(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$('#main-cropper').croppie('bind', {
				url: e.target.result
			});
			$('.actionDone').toggle();
			$('.actionUpload').toggle();
		}

		reader.readAsDataURL(input.files[0]);
	}
}

var resize = $('#main-cropper').croppie({
	viewport: {
		width: 200,
		height: 200
	},
	boundary: {
		width: 300,
		height: 300
	}
});

$(".update_picture").click(function () {
	$("#modal-event").modal("show");
	$("#modal-event").css("display", "block");
	$("#modal-event").removeClass("out");
	$("#modal-event").addClass("in");
});

$(".closing").click(function () {
	$("#modal-event").modal("toggle");
	$("#modal-event").css("display", "none");
	$("#modal-event").removeClass("in");
	$("#modal-event").addClass("out");
});

$("#img-input").change(function () {
	readFile(this);
	$("#valid-resize").css("display", "inline-block");
});

$('#valid-resize').on('click', function (ev) {
	resize.croppie('result', {
		type: 'canvas',
		size: 'viewport',
		format: 'png'
	}).then(function (resp) {
		$.post('/module/profile/updateImage', {
			source: resp,
			datetime: (new Date()).getTime()
		}, function (res) {
			relocate('internal', 'profile', 'profile/-2');
		});
	});
});

//
// RESTE DU CODE
//

$('.alert .close').click(function (e) {
	e.preventDefault();
	$(this).parents('.alert').fadeOut(300);
});

$("#search_content").keydown(function (event) {
	if (event.which == 13) {
		event.preventDefault();
		$("#search_button").click();
	}
});

$("#search_button").click(function () {
	$("#search_results").slideUp();
	$("#search_results").html("");

	var search = $("#search_content").val();
	var count = 0;
	$.get('/module/profile/search', {
		s: search
	}, (data) => {
		let parsed = JSON.parse(data);
		let by_nick = parsed.byNick;
		let by_name = parsed.byName;
		let by_floor = parsed.byFloor;
		let by_birth = parsed.byBirth;

		var html = "";
		if (by_nick.length) {
			html += "<h3>Par surnom</h3>";
			for (let i in by_nick) {
				html += "<a href=\"javascript:relocate('internal', 'profile', 'profile/" + by_nick[i].id + "');\">";
				html += by_nick[i].nick + " (" + by_nick[i].firstname + " " + by_nick[i].name + ")";
				html += "</a><br>";
				count++;
			}
		}

		if (by_name.length) {
			html += "<h3>Par nom et prénom</h3>";
			for (let i in by_name) {
				html += "<a href=\"javascript:relocate('internal', 'profile', 'profile/" + by_name[i].id + "');\">";
				html += by_name[i].nick + " (" + by_name[i].firstname + " " + by_name[i].name + ")";
				html += "</a><br>";
				count++;
			}
		}

		if (by_floor.length) {
			html += "<h3>Par étage</h3>";
			for (let i in by_floor) {
				html += "<a href=\"javascript:relocate('internal', 'profile', 'profile/" + by_floor[i].id + "');\">";
				html += by_floor[i].nick + " (" + by_floor[i].firstname + " " + by_floor[i].name + ")";
				html += "</a><br>";
				count++;
			}
		}

		if (by_birth.length) {
			html += "<h3>Par anniversaire</h3>";
			for (let i in by_birth) {
				html += "<a href=\"javascript:relocate('internal', 'profile', 'profile/" + by_birth[i].id + "');\">";
				html += by_birth[i].nick + " (" + by_birth[i].firstname + " " + by_birth[i].name + ")";
				html += "</a><br>";
				count++;
			}
		}

		if (count == 0) {
			html += "La recherche ne correspond à aucun résultat.";
		}

		html += "<hr>";

		$("#search_results").html(html);
		$("#search_results").slideDown();
	});
});

$("#save").click(function () {
	var errors = new Array();

	const re_text = /^[a-zA-Z\u00C0-\u017F\s']+$/;
	const name = $("#name").val();
	const firstname = $("#firstname").val();
	const nick = $("#nick").val();

	if (name.length && !re_text.test(String(name).toLowerCase())) {
		errors.push('name');
	}
	if (firstname.length && !re_text.test(String(firstname).toLowerCase())) {
		errors.push('firstname');
	}
	if (nick.length && !re_text.test(String(nick).toLowerCase())) {
		errors.push('nick');
	}

	const re_email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	const email = $("#email").val();
	if (email.length && !re_email.test(String(email).toLowerCase())) {
		errors.push('email');
	}

	const re_birth = /^((((19|[2-9]\d)\d{2})\-(0[13578]|1[02])\-(0[1-9]|[12]\d|3[01]))|(((19|[2-9]\d)\d{2})\-(0[13456789]|1[012])\-(0[1-9]|[12]\d|30))|(((19|[2-9]\d)\d{2})\-02\-(0[1-9]|1\d|2[0-8]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\-02\-29))$/;
	var birth = $("#birth").val();
	if (birth.length) {
		birth = birth.split('/');
		if (birth[0].length == 4 && birth[1].length == 2 && birth[2].length == 2) {
			birth = birth[0] + '-' + birth[1] + '-' + birth[2];
		} else if (birth[0].length == 2 && birth[1].length == 2 && birth[2].length == 4) {
			birth = birth[2] + '-' + birth[1] + '-' + birth[0];
		} else {
			errors.push('birth-0');
		}
		if (!re_birth.test(birth)) {
			errors.push('birth-1');
		}
	}

	const re_floor_comparat = /^([tuvx]([0-6]([0][1-9]|[1][0-6])?)?)$/
	const re_floor_adoma = /^([abcd]([1-4]([0-2][0-9])?)?)$/
	var floor = $("#floor").val();
	if (floor.length && !re_floor_comparat.test(String(floor).toLowerCase()) && !re_floor_adoma.test(String(floor).toLowerCase()) && String(floor).toLowerCase() != 'adoma') {
		errors.push('floor');
	} else {
		if (floor.toLowerCase() == "adoma") {
			floor = "Adoma";
		}
	}

	var promo = parseInt($("#promo").val());
	if (promo < 1857 || promo > (new Date()).getFullYear()) {
		errors.push('promo');
	}

	if (errors.length == 0) {
		$("#errors").html("");
		$.post('/module/profile/save', {
			'name': name,
			'firstname': firstname,
			'nick': nick,
			'email': email,
			'birth': birth,
			'floor': floor,
			'promo': promo
		}, function () {
			relocate('internal', 'profile', 'profile/-2');
		});
	} else {
		html = ""
		for (let i in errors) {
			if (errors[i] == 'name' || errors[i] == 'firstname' || errors[i] == 'nick') {
				var champ = 'nom';
				if (errors[i] == 'firstname') {
					champ = 'prénom';
				} else if (errors[i] == 'nick') {
					champ = 'surnom';
				}
				html += "<p>Le " + champ + " ne doit pas contenir de caractères spéciaux.</p>";
			} else if (errors[i] == 'email') {
				html += "<p>Le format de l'email est incorrect.</p>";
			} else if (errors[i] == 'birth-0') {
				html += "<p>Le format de la date de naissance doit être JJ/MM/AAAA ou AAAA/MM/JJ.</p>";
			} else if (errors[i] == 'birth-1') {
				html += "<p>La date d'anniversaire renseignée n'existe pas dans le calendrier.</p>";
			} else if (errors[i] == 'floor') {
				html += "<p>L'étage doit être du type X, X0-X6, X101-X116, A, A0-A4, A101-A129 ou Adoma</p>";
			} else if (errors[i] == 'promo') {
				html += "<p>La promotion doit être une année au format AAAA.</p>";
			}
		}
		$("#errors").html(html);
	}
});

$("#savePassword").click(function () {
	if ($("#new").val() == $("#new_check").val()) {
		var oldPassword = $("#old").val();
		var newPassword = $("#new").val();
		$.post('/module/profile/savePassword', {
			'new': newPassword,
			'old': oldPassword
		}, function (result) {
			if (result.return == 'mismatch') {
				$("#errorsPassword").html("L'ancien mot de passe n'est pas le bon.");
			} else if (result.return == 'invalid' || result.return == 'unable') {
				$("#errorsPassword").html("Impossible de changer le mot de passe, veuillez réessayer.");
			} else {
				relocate('internal', 'profile', 'profile/-2');
			}
		});
	} else {
		$("#errorsPassword").html("Les nouveaux mots de passe ne sont pas identiques.");
	}

});