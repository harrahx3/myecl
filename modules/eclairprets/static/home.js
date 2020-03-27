$.get('/module/eclairprets/lectureMateriel', (data) => {
    const toutLeMateriel = data.toutLeMateriel;
    let dynamicContent = "";
    for (let i = 0; i < toutLeMateriel.length; i++) {
        // remplissage du html
        let cur = toutLeMateriel[i];
        dynamicContent += "<p>" + cur.nom + " " + cur.description + "</p>";
    }
    $("#materiel").html(dynamicContent);
});