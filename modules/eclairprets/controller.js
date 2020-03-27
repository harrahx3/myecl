const fs = require('fs');

exports.ajoutMateriel = function (req, res) {
    const nom = req.body.nom;
    const description = req.body.description;
    const image = req.file.path;
    const caution = req.body.caution;

    let extension = image.split('.');
    extension = extension[extension.length - 1];
    if (['png', 'jpg', 'jpeg', 'gif', 'tiff', 'ico', 'bmp'].indexOf(extension) <= -1) {
        fs.unlink(image, (error) => {
            if (error) {
                res.logger.error(error);
                res.sendStatus(500);
            } else {
                res.json({ 'message': 'erreur format image' });
            }
        });
    } else {
        if (!/^[a-zA-Z0-9àâäéêëèîïôöûùüÿŷ\_\-\s]*$/im.test(nom) || !/^[a-zA-Z0-9àâäéêëèîïôöûùüÿŷ\_\-\s]*$/im.test(description) || !/^[0-9]*$/im.test(caution)) {
            res.json({ 'message': 'erreur format' });
        } else {
            req.database.query("INSERT INTO materielEclair (nom, description, image, caution id_pret) VALUES (?, ?, ?, ?, -1);", [nom, description, image, caution], (error, result) => {
                if (error) {
                    res.logger.error(error);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    }
};

exports.editionMateriel = function (req, res) { };
exports.suppressionMateriel = function (req, res) { };
exports.lectureMateriel = function (req, res) {
    req.database.query("SELECT id, nom description, image, caution FROM materielEclair ORDER BY nom DESC", (error, result) => {
        if (error) {
            req.logger.error(error);
            req.sendStatus(500);
        } else {
            toutLeMateriel = [];
            for (let key in result) {
                toutLeMateriel.push({
                    'id': result[key].id,
                    'nom': result[key].nom,
                    'descrption': result[key].description,
                    'image': result[key].image,
                    'caution': result[key].caution,
                });
            }
            res.json({ "toutLeMateriel": toutLeMateriel });
        }
    });
};

exports.rechercheMateriel = function (req, res) { };

exports.ajoutPret = function (req, res) { };
exports.editionPret = function (req, res) { };
exports.suppressionPret = function (req, res) { };
exports.lecturePret = function (req, res) {
    req.database.query("SELECT p.id, cu.id AS idUser, cu.firstname AS firstname, " +
        "cu.name AS name, cu.nick AS nick, m.nom AS nom, " +
        "m.description AS description, date_debut AS dateDebut, " +
        "date_fin_attendue AS dateFinAttendue, moyen_paiement AS moyenPaiement" +
        "FROM pretEclair AS p " +
        "JOIN materielEclair AS m ON p.id_materiel = m.id " +
        "JOIN core_user AS cu ON p.id_user = cu.id " +
        "ORDER BY date_debut DESC", (error, result) => {
            if (error) {
                res.json({ 'message': 'erreur serveur' });
            } else {
                let tousLesPrets = [];
                for (let key in result) {
                    let cur = result[key];
                    tousLesPrets.push({
                        'id': cur.id,
                        'user': {
                            'id': cur.idUser,
                            'firstname': cur.firstname,
                            'name': cur.name,
                            'nick': cur.nick
                        },
                        'materiel': {
                            'nom': cur.nom,
                            'description': cur.description
                        },
                        'dateDebut': cur.dateDebut,
                        'dateFinAttendue': cur.dateFinAttendue,
                        'moyenPaiement': cur.moyenPaiement
                    });
                }
                res.json({ 'tousLesPrets': tousLesPrets });
            }
        });
};

exports.mesPrets = function (req, res) {
    req.database.query("SELECT m.nom AS nom, m.description AS description, p.date_debut AS dateDebut, p.date_fin_attendue AS dateFinAttendue FROM pretEclair AS p JOIN materielEclair AS m ON p.id_materiel = m.id WHERE id_user = ? ORDER BY dateDebut;", [req.user.id], (error, result) => {
        if (error) {
            res.logger.error(error);
            res.sendStatus(500);
        }
    })
};

exports.suppressionHistorique = function (req, res) { };
exports.lectureHistorique = function (req, res) { };