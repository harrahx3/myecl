/*jshint esversion: 6 */

const reLogin = /^[a-zA-Z0-9]+$/;
const reText = /^[a-zA-Z\u00C0-\u017F\s']+$/;
const reFloorComparat = /^([tuvx]([0-6]([0][1-9]|[1][0-6])?)?)$/;
const reFloorAdoma = /^([abcd]([1-4]([0-2][0-9])?)?)$/;

// Début de Croppie
function readFile(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = e => {
			$('#main-cropper').croppie('bind', {
				url: e.target.result
			});
			$('.actionDone').toggle();
			$('.actionUpload').toggle();
		};
		reader.readAsDataURL(input.files[0]);
	}
}

const resize = $('#main-cropper').croppie({
	viewport: {
		width: 200,
		height: 200
	},
	boundary: {
		width: 300,
		height: 300
	},
	url: ''
});
// Fin Croppie

$(document).ready(function () {
	$('.registration-form fieldset:first-child').fadeIn('slow');
	$('input').on('focus', function () {
		$(this)
			.closest('.form-group')
			.removeClass('has-error');
	});
	$('input').on('keypress', function (event) {
		if (event.which == 13) {
			event.preventDefault();
		}
	});

	// handling navigation
	$('#next0').click(function () {
		$.get('/loginAvailable', {
			login: $('#login').val()
		}, function (result) {
			var message = '';

			const login = $('#login').val();
			const name = $('#name').val();
			const firstname = $('#firstname').val();
			const password = $('#password').val();
			const check = $('#conf-password').val();

			if (!login.length || !reLogin.test(String(login).toLowerCase())) {
				message +=
					'<li>Le login ne doit contenir que des caractères alphanumériques sans espaces</li>';
				$('#login-input').addClass('has-error');
			} else if (result.result) {
				message += '<li>Le login est déjà pris</li>';
				$('#login-input').addClass('has-error');
			}
			if (!name.length || !reText.test(String(name).toLowerCase())) {
				message +=
					'<li>Le nom ne doit pas contenir de caractères spéciaux</li>';
				$('#name-input').addClass('has-error');
			}
			if (!firstname.length || !reText.test(String(firstname).toLowerCase())) {
				message +=
					'<li>Le prénom ne doit pas contenir de caractères spéciaux</li>';
				$('#firstname-input').addClass('has-error');
			}
			if (!password.length || password.length < 6) {
				message += '<li>Le mot de passe doit faire au moins 6 caractères</li>';
				$('#password-input').addClass('has-error');
			}
			if (!check.length) {
				message += '<li>Veuillez vérifier votre mot de passe</li>';
				$('#conf-password-input').addClass('has-error');
			}
			if (password != check) {
				message += '<li>Les mots de passe ne sont pas identiques</li>';
				$('#password-input').addClass('has-error');
				$('#conf-password-input').addClass('has-error');
			}

			if (message != '') {
				$('#error0').html(
					'<div class=\'alert alert-danger\'><ul>' + message + '</ul></div>'
				);
			} else {
				$('#error0').html('');
				$('#fieldset0').fadeOut(400, function () {
					$('#fieldset1').fadeIn();
				});
			}
		});
	});

	$('#next1').click(function () {
		const picture = $('#picture').val();
		const pictureSource = $('.image_picker_image.cropped').attr('src');
		const pictureSize = 2 * pictureSource.length / 1024 / 1024;

		var message = '';
		if (picture == '1' && (pictureSource == '' || pictureSource.slice(0, 21) != 'data:image/png;base64')) {
			message += '<li>Veuillez sélectionner une image</li>';
		} else if (pictureSize >= 2) {
			message += '<li>Veuillez choisir une image de moins de 2 Mo</li>';
		}
		if (message != '') {
			$('#error1').html(
				'<div class=\'alert alert-danger\'><ul>' + message + '</ul></div>'
			);
		} else {
			$('#error1').html('');
			$('#fieldset1').fadeOut(400, function () {
				$('#fieldset2').fadeIn();
			});
		}
	});

	$('#previous1').click(function () {
		$('#fieldset1').fadeOut(400, function () {
			$('#fieldset0').fadeIn();
		});
	});

	$('#previous2').click(function () {
		$('#fieldset2').fadeOut(400, function () {
			$('#fieldset1').fadeIn();
		});
	});

	// form submission
	$('#submitcreate').click(function () {
		var message = '';
		var nick = $('#nick').val();
		var promo = parseInt($('#promo').val());
		var floor = $('#floor').val();

		if (!nick.length || !reLogin.test(String(nick).toLowerCase())) {
			message +=
				'<li>Le surnom ne doit pas contenir de caractères spéciaux</li>';
			$('#nick-input').addClass('has-error');
		}
		if (isNaN(promo) || promo < 1857 || promo > (new Date()).getFullYear()) {
			message +=
				'<li>L\'année de promo doit être comprise entre 1857 et ' +
				(new Date()).getFullYear().toString() +
				'</li>';
			$('#promo-input').addClass('has-error');
		}
		if (
			!floor.length ||
			(!reFloorComparat.test(String(floor).toLowerCase()) &&
				!reFloorAdoma.test(String(floor).toLowerCase()) &&
				String(floor).toLowerCase() != 'adoma')
		) {
			message +=
				'<li>L\'étage doit être au format X, X1, X101, A, A1, A101, Adoma ou Autre</li>';
			$('#floor-input').addClass('has-error');
		} else {
			if (floor.toLowerCase() == 'adoma') {
				floor = 'Adoma';
			} else if (floor.toLowerCase() == 'autre') {
				floor = 'Autre';
			}
		}

		if (message != '') {
			$('#error2').html(
				'<div class=\'alert alert-danger\'><ul>' + message + '</ul></div>'
			);
		} else {
			$('#error2').html('');
			const data = {
				login: $('#login').val(),
				name: $('#name').val(),
				firstname: $('#firstname').val(),
				password: $('#password').val(),
				picture: $('#picture').val(),
				pictureSource: $('.image_picker_image.cropped').attr('src'),
				nick: $('#nick').val(),
				promo: $('#promo').val(),
				floor: $('#floor').val()
			};

			$.post('/signup', {
				data: data
			}, function (result) {
				console.log(result);
				if (result.state) {
					$('#fieldset2').fadeOut(400, function () {
						$('#fieldset3').fadeIn();
					});
				}
			});
		}
	});

	// image picker
	$('select').imagepicker({
		hide_select: false
	});

	// ajout d'une image
	$('.cropped').click(function () {
		$('#modal-event').modal('show');
	});

	$('#img-input').change(function () {
		readFile(this);
	});

	$('#valid-resize').on('click', ev => {
		resize
			.croppie('result', {
				type: 'canvas',
				size: 'viewport'
			})
			.then(resp => {
				$('#modal-event').modal('toggle');
				this.picture = $('img.cropped');
				this.picture.attr('src', resp);
			});
	});

	$('#signin').click(function () {
		window.location.href = '/signin';
	});
});