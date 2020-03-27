$.get('/module/ctnprets/lecturePrets', (data) => {
    const prets = data.prets;
    var html = "";
    for (let i = 0; i < prets.length; i++) {
        const obj = prets[i];
        html += obj.user.firstname;
    }
    $("#tousLesPrets").html(html);
});

$(document).on('click', '#ajoutMateriel', function () {
    $.post('/module/ctnprets/ajoutPrets', {
        'nom': $("#name").val(),
        'description': $("#description").val(),
        'caution': $("#caution").val()
    }, (data) => {

    });
});