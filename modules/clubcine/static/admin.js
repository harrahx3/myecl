var loadMovies = function () {
	$('#activeList').html('');
	$('#inactiveList').html('');
	$.get('/module/clubcine/getActiveMovies', (res) => {
		for (let i in res.movies) {
			var date = new Date(res.movies[i].date);
			let day = date.getDate();
			let month = date.getMonth() + 1;
			let hour = date.getHours();
			let row = '<div class="form-group container hline">';
			row += '<div class="row">'
			row += '<div class="col-md-4">' + res.movies[i].title + ' (' + day + '/' + month + ' ' + hour + 'h' + ')</div>';
			row += '<div class="col-md-4 col-md-offset-4"><button class="btn btn-default pull-center btn-multi" id="toggle-' + res.movies[i].id + '">Désactiver</button>';
			row += '<button class="btn btn-warning pull-center btn-multi" id="update-' + res.movies[i].id + '">Modifier</button>';
			row += '<button class="btn btn-danger pull-center btn-multi" id="delete-' + res.movies[i].id + '">Supprimer</button></div>';
			row += '</div>';
			$('#activeList').append(row);

			enableActions(res, i);
		}
	});
	$.get('/module/clubcine/getInactiveMovies', function (res) {
		for (let i in res.movies) {
			let day = res.movies[i].date.split("T")[0].split("-")[2];
			let month = res.movies[i].date.split("T")[0].split("-")[1];
			let hour = res.movies[i].date.split("T")[1].split(":")[0];
			let row = '<div class="form-group container hline">';
			row += '<div class="row">'
			row += '<div class="col-md-4">' + res.movies[i].title + ' (' + day + '/' + month + ' ' + hour + 'h' + ')</div>';
			row += '<div class="col-md-4 col-md-offset-4"><button class="btn btn-default pull-center btn-multi" id="toggle-' + res.movies[i].id + '">Activer</button>';
			row += '<button class="btn btn-warning pull-center btn-multi" id="update-' + res.movies[i].id + '">Modifier</button>';
			row += '<button class="btn btn-danger pull-center btn-multi" id="delete-' + res.movies[i].id + '">Supprimer</button></div>';
			row += '</div>';
			$('#inactiveList').append(row);

			enableActions(res, i);
		}
	});
}

var enableActions = function (res, i) {
	$('#toggle-' + res.movies[i].id).on('click', function () {
		$.post('/module/clubcine/toggleMovie', {
			id: res.movies[i].id
		}, function () {
			loadMovies();
		});
	});

	$('#update-' + res.movies[i].id).on('click', function () {
		$.get('/module/clubCine/getMovie', {
			id: res.movies[i].id
		}, function (movie) {
			$("#movieId").attr('value', res.movies[i].id);
			$('#updateHead').html('<i class="fas fa-bookmark"></i>Modifier ' + movie.title);
			$('#updateTitle').attr('value', movie.title);
			$('#updateInfos').attr('value', movie.infos);
			$('#updateDate').attr('value', movie.date.split('T')[0]);
			$('#updateHour').attr('value', movie.date.split('T')[1].substring(0, 5));
			$('#updateSynopsis').html(movie.synopsis);

			$('#updateMovieSection').show();
			$('#imageSelectBlock').hide();

			$('#cancelUpdate').off();
			$('#cancelUpdate').on('click', function (e) {
				e.preventDefault();
				$('#updateMovieSection').hide();
			});
		});
	});

	$('#delete-' + res.movies[i].id).on('click', function () {
		$.post('/module/clubcine/deleteMovie', {
			id: res.movies[i].id
		}, function () {
			loadMovies();
		});
	});
};

$(document).ready(function () {
	loadMovies();

	$('#createMovieSection, #updateMovieSection').hide();
	$('#createMovieForm').on('click', function () {
		$('#createMovieSection').toggle();
	});

	$('#cancelCreateMovie').on('click', function (e) {
		e.preventDefault();
		$('#createMovieSection').toggle();
	});
});