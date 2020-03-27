$(document).ready(function () {
	$.get('/module/clubcine/getActiveMovies', (movies) => {
		for (let i in movies.movies) {
			let day = movies.movies[i].date.split("T")[0].split("-")[2];
			let month = movies.movies[i].date.split("T")[0].split("-")[1];
			let hour = movies.movies[i].date.split("T")[1].split(":")[0];
			let html = '<section id="movie' + movies.movies[i].id + '" class="download-section content-section text-center" style="background:url(\'uploads/' + movies.movies[i].image + '\') no-repeat center center scroll; background-size:cover;">';
			html += '<div class="container">';
			html += '<div class="row">';
			html += '<div class="col-md-8 col-md-offset-2">';
			html += '<h1>' + movies.movies[i].title + '</h1>';
			html += '<p>' + movies.movies[i].infos + ', le ' + day + '/' + month + ' à ' + hour + 'h.</p>';
			html += '<a id="btn' + movies.movies[i].id + '" href="#synop' + movies.movies[i].id + '" class="btn btn-default btn-lg btn-synop">Synopsis</a>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
			html += '</section>';

			html += '<section id="synop' + movies.movies[i].id + '" class="content-section text-center synop">';
			html += '<div class="container">';
			html += '<div class="row">';
			html += '<div class="col-md-8 col-md-offset-2">';
			html += '<h2>Synopsis</h2>';
			html += '<p>' + movies.movies[i].synopsis + '</p>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
			html += '</section>';
			$('#main-content-wrapper').append(html);

			$('#btn' + movies.movies[i].id).on('click', function () {
				$('#synop' + movies.movies[i].id).toggle();
			});
		}
		$('.synop').hide();
	});
});