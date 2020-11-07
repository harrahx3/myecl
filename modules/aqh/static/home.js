
// Code javascript executer coté client

/*  <div class="form-group">
    <label for="exampleFormControlSelect1">Example select</label>
    <select class="form-control" id="exampleFormControlSelect1">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>
  </div>
*/

var socket = io.connect('https://localhost');

//var pseudo = prompt('Quel est votre pseudo ?');
//socket.emit('petit_nouveau', pseudo);

socket.on('message', function(obj) {
    console.log('Le serveur a un message pour vous : ' + obj.message);
    addmessage(obj.pseudo, obj.message);
});
socket.on('autre', function(message) {
    console.log('Le serveur a un message pour vous : ' + message);
});

socket.on('nouveau', function(pseudo) {
    console.log(pseudo + ' a rejoint ');
    addmessage(pseudo, "a rejoint le chat.")
});
/*  var button = getElementById('#poke');

button.click(function () {
    socket.emit('message', 'Salut serveur, ça va ?');
});*/

function addmessage(pseudo, message) {
  var node = document.createElement("LI");                 // Create a <li> node
  var textnode = document.createTextNode(pseudo + ': ' + message);         // Create a text node
  node.appendChild(textnode);                              // Append the text to <li>
  document.getElementById("myList").appendChild(node);     // Append <li> to <ul> with id="myList"
};



function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }



    async function triggerPushNotificationSubscription() {
      if ('serviceWorker' in navigator) {
        const register = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        const publicVapidKey = 'BH3iIFAa05KHsYCDND5vXpa_MqRALURmWGpRX3dg5lBaxS6WQXEzJdhda3_dNAoKR3OD8txdiM2Op9mv-71eXPs';

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

				$.post('/module/aqh/subscribe', {
					content: JSON.stringify(subscription)
				});

				// broadcastPushNotification();

        /*await fetch('module/aqh/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'Content-Type': 'application/json',
          },
        });*/
      } else {
        console.error('Service workers are not supported in this browser');
      }
    }


    async function broadcastPushNotification(msg) {
      /*  await fetch('module/aqh/broadcast_notif', {
          method: 'GET'
        });*/
				$.post('/module/aqh/broadcast_notif', {title: msg});
    }


$(document).ready(function () {
//	triggerPushNotificationSubscription();
//	$(".summernote").summernote({});
	$('.summernote').summernote({
		height: 150
	});
//	triggerPushNotificationSubscription();
//	broadcastPushNotification();
	//$('[data-toggle="popover"]').popover();
});

$(document).on('click', '.deletePost', function () {
//	broadcastPushNotification();

	var id = $(this).attr('id');
	$.post('/module/aqh/deletePost', {
		id: id
	}, (result) => {
		$(".summernote").code('<p><br></p>');
		$("#current").val(-1);
		//loadNews();
	/*	$.get('/module/aqh/getAllEvents', (result) => {
			$("#main-content-wrapper").html(result);
		});
		*/
		relocate('internal', 'aqh', 'home');
	});
});

$(document).on('click', '.validatePost', function () {
//	broadcastPushNotification();
	var id = $(this).attr('id');
	$.post('/module/aqh/validatePost', {
		id: id
	}, (result) => {
		//loadNews();
	/*	$.get('/module/aqh/getAllEvents', (result) => {
			$("#main-content-wrapper").html(result);
		});
		*/
		relocate('internal', 'aqh', 'home/-1');
	});
});

$(document).on('click', '.deleteComment', function () {
	// broadcastPushNotification();
	var id = $(this).attr('id');
	$.post('/module/aqh/deleteComment', {
		id: id
	}, (result) => {
		//loadNews();
	/*	$.get('/module/aqh/getAllEvents', (result) => {
			$("#main-content-wrapper").html(result);
		});*/
		relocate('internal', 'aqh', 'home/-1');
	});
});

$(document).on('click', '.edit', function () {
	// broadcastPushNotification();
	var id = $(this).attr('id');
	$.get('/module/aqh/getOne', {
		id: id
	}, (result) => {
		$("#current").val(id);
		//$(".summernote").code(result.content);
    var selector = "#content"+result.eventid;
    $(selector).summernote('code', result.content);
	});
});

$(".addPost").click(function (e) {
	//broadcastPushNotification();
//$(document).on('click', '.add', function () {
	console.log("click add Post button");
	e.preventDefault();

	var post_id = 0;
	if (parseInt($("#current").val()) > 0) {
		post_id = $("#current").val();
	}
	var event_id = $(this).attr('id');
	console.log(event_id);

	var selector = "#content"+event_id;

  //var content = $(selector).code();
  var content = $(selector).summernote('code');

	console.log(content);

	if (post_id > 0) {
		$.post('/module/aqh/update', {
			content: content,
			id: post_id
		});
		$("#current").val(-1);
	} else {
		$.post('/module/aqh/addPost', {
			content: content,
			eventid: event_id
		});
	}
  //$(selector).code('<p><br></p>');
	$(selector).summernote('code', '<p><br></p>');
//	loadNews();
/*	$.get('/module/aqh/getAllEvents', (result) => {
		$("#main-content-wrapper").html(result);
	});*/
  $("#top_notif_area").html("<div class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>  <p> Votre post à été ajouté et doit être validé par un modérateur avant d\'être visible publiquement</p></div>");
//	relocate('internal', 'aqh', 'home/-1');
  //relocate('/user#event20');
});

$(".addComment").click(function (e) {
	// broadcastPushNotification();
//$(document).on('click', '.add', function () {
	console.log("click addComment button");
	e.preventDefault();

	var post_id = $(this).attr('id');

	var selector = "#newcomment"+post_id;

	var content = $(selector).val();
	console.log(content);

	$(selector).val('');

	if (content) {
		$.post('/module/aqh/addComment', {
			content: content,
			postid: post_id
		});

	//	loadNews();
		/*$.get('/module/aqh/getAllEvents', (result) => {
			$("#main-content-wrapper").html(result);
		});*/
		relocate('internal', 'aqh', 'home/-1');
	}

});

triggerPushNotificationSubscription();
/*$(document).on('click', '.delete', function () {
	var id = $(this).attr('id');
	$.post('/module/aqh/delete', {
		id: id
	}, (result) => {
	});
});
*/

/*
afficher = function (){

	var bightml = "";
	var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

	for (var myevent of events) {

		console.log(myevent);
		var str =$("#tablist").html()+"<li><a href='#event"+myevent.id+"' role='tab' data-toggle='tab'>"+myevent.title+"</a></li>";
	//	console.log(str);
		$("#tablist").html(str);

	//	var str2 = $("#tablecontent").html()+"<div id='#event"+myevent.id+"' class='tab-pane fade'><p>event +"myevent.title+"</p></div>";


	var html = "";

	html+="<h>"+myevent.title+"</h>";

//	$.get('/module/aqh/getAll', (myevent) => {
		html += "<div class='panel-group' id='accordion'>";

		if (myevent.hasOwnProperty("posts")) {
			if (myevent.posts.length == 0) {
				html += "<div class='panel panel-default' id='0'>";
				html += "<div class='panel-heading'>";
				html += "<h4 class='panel-title'>";
				html += "<a data-toggle='collapse' data-parent='#accordion' href='#accordion0' id='link0'>Pas encore de posts pour cet événement<i class='fa fa-angle-down pull-right'></i><i class='fa fa-angle-up pull-right'></i></a>"
				html += "</h4>";
				html += "</div>";
				html += "<div id='accordion0' class='panel-collapse collapse in'>";
				html += "<div class='panel-body'>";
				html += "<div class='row'>";
				html += "<div class='col-md-10 col-md-offset-1'>";
				html += "Pas encore de postes";
				html += "</div>";
				html += "</div>";
				html += "</div>";
				html += "</div>";
				html += "</div>";
			}
			for (let i in myevent.posts) {
				console.log(myevent.posts[i]);
				html += "<div class='panel panel-default' id='" + myevent.posts[i].id + "'>";
				html += "<div class='panel-heading'>";
				html += "<h4 class='panel-title'>";
				var date = myevent.posts[i].date.split('-');
				var year = date[0];
				var month = date[1];
				month = months[parseInt(month) - 1];
				var day = date[2].split(' ')[0];
				var author = myevent.posts[i].author;

				html += "<a data-toggle='collapse' data-parent='#accordion' href='#accordion" + myevent.posts[i].id + "' id='link" + myevent.posts[i].id + "'>Post du " + day + " " + month + " " + year + " par " + author +" <i class='fa fa-angle-down pull-right'></i><i class='fa fa-angle-up pull-right'></i></a>"
				html += "<td><button class='btn btn-danger delete' id='" + myevent.posts[i].id + "'>Supprimer</button></td>";

				html += "</h4>";
				html += "</div>";
				html += "<div id='accordion" + myevent.posts[i].id + "' class='panel-collapse collapse"
				if (i == 0) {
					html += " in";
				}
				html += "'>";
				html += "<div class='panel-body'>";
				html += "<div class='row'>";
				html += "<div class='col-md-10 col-md-offset-1'>";
				html += myevent.posts[i].content;
				html += "</div>";
				html += "</div>";
				html += "</div>"
				html += "</div>";
			}
		}

		html += "</div>";

		var str2 = $("#tablecontent").html()+"<div id='event"+myevent.id+"' class='tab-pane fade'><p>event"+"<div  class='col-md-offset-2 col-md-8'>"+html+"</div></p></div>";
//var str2 = $("#tablecontent").html();
		//console.log(str2);
		$("#tablecontent").html(str2);
		bightml+=html;
	}
	//$("#list").html(bightml);
	a+=1;
	if (a>0){
		clearInterval(x);
	}
}

$(document).ready(() => {

	$.get('/module/aqh/getAllEvents', (result) => {

		console.log(result);

		events=[];

		if (result.hasOwnProperty("events")) {

			for (let event of result.events) {

				$.post( '/module/aqh/getPostsForEvent', { eventid: event.id })
					.done(function( data ) {
						console.log( "Data Loaded: " + data );
						if (data.hasOwnProperty("posts")){
							events.push({
								id: event.id,
								author: event.author,
								content: event.content,
								date: event.date,
								title: event.title,
								posts: data.posts
							});
						};
						console.log(events.length);
					});
		}

		console.log("events:");
		console.log(events);

		a=0;
		x=setInterval(afficher,500) ;

		}
	});
});
*/
