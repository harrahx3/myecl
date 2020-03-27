$("#addGroup").click(function () {
	var name = $("#name").val();
	var description = $("#description").val();
	$.post('/module/admin/createGroup', {
		name: name,
		description: description
	}, function (result) {
		if (result.success == -1) {
			$("#error").html("Impossible de créer le groupe : le nom du groupe doit être non vide");
		} else if (result.success == 0) {
			$("#error").html("Impossible de créer le groupe : le nom du groupe est déjà pris");
		} else {
			relocate('internal', 'admin', 'home');
		}
	});
});