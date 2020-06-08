/* jshint esversion:6*/

$('#logout').on('click', function () {
	const loc = window.location.href.split('/');
	window.location.href = loc[0] + '/signout';
});

// TODO description
const makeMenu = (menu, data, moduleName = "") => {
	for (let i in data) {
		let item = data[i];

		if (item.type == 'external') {
			let link = '<li><a href=\'' + item.route + '\'><span class=\'text\'>';
			if (item.icon) {
				link += item.icon;
			}
			link += item.name;
			if (item.beta) {
				link += '<div class=\'ribbon\'><span>beta</span></div>';
			}
			link += '</span></a></li>';
			menu.append(link);
		} else if (item.type == 'internal') {
			let modName = item.moduleName ? item.moduleName : moduleName;
			let link = "<li><a href=\"javascript:relocate('" + item.type + "','" + modName + "','" + item.anchor + "');\"><span class='text'>";
			if (item.icon) {
				link += item.icon;
			}
			link += item.name;
			if (item.beta) {
				link += '<div class=\'ribbon\'><span>beta</span></div>';
			}
			link += '</span></a></li>';
			menu.append(link);
		} else { // submenu
			let sub = $('<ul class=\'sub-menu close\'></ul>');
			makeMenu(sub, item.anchor, item.moduleName);
			let link = $('<li><a class=\'js-sub-menu-toggle\'><span class=\'text\'>' + item.name + '</span><i class=\'toggle-icon fa fa-angle-down\'></i></a></li>');
			link.append(sub);
			menu.append(link);
		}
	}
};


$(document).on('click', '.js-sub-menu-toggle', function () {
	if ($(this).next().hasClass('close')) {
		$(this).next().removeClass('close').addClass('open');
		$(this).children().eq(1).removeClass('fa-angle-down').addClass('fa-angle-up');
	} else {
		$(this).next().removeClass('open').addClass('close');
		$(this).children().eq(1).removeClass('fa-angle-up').addClass('fa-angle-down');
	}
});

// TODO description
const makeHeader = (header, data) => {
	for (let i in data) {
		let item = data[i];

		if (item.type == 'external') {
			let link = '<div class=\'icone\'><a href=\'' + item.route + '\'>';
			link += item.icon;
			if (item.name || item.beta) {
				link += '<span class=\'text\'>';
				if (item.name) link += item.name;
				link += '</span>';
			}
			link += '</a></div>';
			header.append(link);
		} else { // internal
			let link = "<div class='icone'><a href=\"javascript:relocate('" + item.type + "','" + item.moduleName + "','" + item.anchor + "');\">";

			link += item.icon;
			if (item.name || item.beta) {
				link += '<span class=\'text\'>';
				if (item.name) link += item.name;
				link += '</span>';
			}
			link += '</a></div>';
			header.append(link);
		}
	}
};

const relocate = (type, moduleName, location) => {
	$.post('/userLocate', {
		type: type,
		location: location,
		moduleName: moduleName
	}).done(makeWall);
};

const makeWall = () => {
	const body = $('#main-content-wrapper');
	const reference = $('#contact-content-wrapper');
	const styles = $('head');
	$('.dyn-content').remove();

	$.get('/userLocate', (location) => {
		if (location.route == "") {
			relocate('', '', '');
		}

		const moduleName = location.moduleName;
		const route = location.route;
		var location = location.location;

		if (moduleName.length) { // chargement d'un module
			$.get('/includes/' + moduleName, (includes) => {
				var stylesHtml = '';
				if (includes.hasOwnProperty('styles')) {
					for (let i = 0; i < includes.styles.length; i++) {
						stylesHtml += '<link class=\'dyn-content\' href=\'' + includes.styles[i].route + '\' rel=\'stylesheet\' type=\'text/css\'>\n';
					}
					styles.append(stylesHtml);
				}

				if (includes.hasOwnProperty('scripts')) {
					for (let i = 0; i < includes.scripts.length; i++) {
						var script = document.createElement('script');
						script.type = 'text/javascript';
						script.src = includes.scripts[i].route;
						script.class = 'dyn-content';
						document.body.appendChild(script);
					}
				}
			});

			$.get('/includes/' + moduleName + '/' + location, (includes) => {
				var stylesHtml = '';
				for (let i = 0; i < includes.styles.length; i++) {
					stylesHtml += '<link class=\'dyn-content\' href=\'' + includes.styles[i].route + '\' rel=\'stylesheet\' type=\'text/css\'>\n';
				}
				styles.append(stylesHtml);

				for (let i = 0; i < includes.scripts.length; i++) {
					var script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = includes.scripts[i].route;
					script.class = 'dyn-content';
					document.body.appendChild(script);
				}
			});

			$.get(route, (res) => {
				body.html(res);
			});

			$.get('/contact/' + moduleName, (contact) => {
				contentHTML = '<p>Contact asso : ';
				if (contact.firstname) {
					contentHTML += contact.firstname;
				}
				if (contact.lastname) {
					contentHTML += ' ' + contact.lastname;
				}
				if (contact.phone) {
					contentHTML += ' - ' + contact.phone;
				}
				if (contact.email) {
					contentHTML += ' - ' + contact.email;
				}
				contentHTML += '</p>';
				reference.html(contentHTML);
			});
		} else { // chargement des tuiles
			reference.html('');
			body.html('');
		}
	});
};

$(document).ready(function () {
	$.get('/menu', (data) => {
		makeMenu($('#dynamicMenu'), data);
	});

	$.get('/header', (data) => {
		makeHeader($('#dynamicHeader'), data);
	});

	makeWall();
});
