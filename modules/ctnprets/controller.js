const fs = require('fs');

exports.ajoutMateriel = function (req, res) {
    const nom = req.body.nom;
    const description = req.body.description;
    const caution = req.body.caution;
    const image = req.file.path;
    // let filePath = image.split('/');
    // filePath = filePath[filePath.length - 1];

    if (!/^[a-zA-Z0-9éàêîïôùûèëâŷÿ\_\-]*$/im.test(nom) || !/^[a-zA-Z0-9éàêîïôùûèëâŷÿ\_\-\s]*$/im.test(description) || !/^[0-9]*$/im.test(caution)) {
        res.json({ 'message': 'erreur format' });
    } else {
        let extension = image.split('.');
        extension = extension[extension.length - 1];

        if (['png', 'svg', 'tiff', 'jpg', 'jpeg', 'ico', 'gif'].indexOf(extension) <= -1) {
            // suppression du fichier
            fs.unlink(image, (err) => {
                if (err) {
                    req.logger.error(err);
                    res.json({ 'message': 'erreur suppression image' });
                } else {
                    res.json({ 'message': 'erreur extension' });
                }
            });
        } else {
            req.database.query('INSERT INTO materielCTN (nom, description, caution, id_pret, image) VALUES (?, ?, ?, -1, ?);', [nom, description, caution, image], (error, result) => {
                if (error) {
                    req.logger.error(error);
                    res.json({ 'message': 'erreur serveur' });
                } else {
                    res.json({ 'message': 'succes' });
                }
            });
        }
    }
};

exports.editionMateriel = function (req, res) { };
exports.suppressionMateriel = function (req, res) { };
exports.lectureMateriel = function (req, res) { };
exports.rechercheMateriel = function (req, res) { };

exports.ajoutPret = function (req, res) {
    const idMateriel = req.body.idMateriel;
    const idUser = req.body.idUser;
    const dateFinAttendue = req.body.dateFinAttendue;
    const moyenPaiement = req.body.moyenPaiement;

    if (!/^[0-9]*$/im.test(idMateriel) || !/^[0-9]*$/im.test(idUser) || !/^[0-1]*$/im.test(moyenPaiement)) {
        res.json({ 'message': 'erreur format' });
    } else {
        req.database.query('INSERT INTO pretCTN (id_materiel, id_user, date_debut, date_fin_attendue, moyen_paiement) VALUES (?, ?, NOW(), ?, ?);', [idMateriel, idUser, dateFinAttendue, moyenPaiement], (error, result) => {
            if (error) {
                req.logger.error(error);
                res.json({ 'message': 'erreur serveur' });
            } else {
                res.json({ 'message': 'succes' });
            }
        });
    }
};

exports.editionPret = function (req, res) { };
exports.suppressionPret = function (req, res) { };

exports.lecturePret = function (req, res) {
    req.database.query("SELECT p.id as id, cu.firstname AS firstname, cu.nick as nick, " +
        "cu.lastName as lastName, date_debut as dateDebut, date_fin_attendue as dateFin, " +
        "moyen_paiement AS moyenPaiement, m.name AS materiel " +
        "FROM pretCTN as p " +
        "JOIN core_user AS cu ON cu.id = p.id_user " +
        "JOIN materielCTN as m ON m.id = p.id_materiel " +
        "ORDER BY date_debut DESC; ", (error, result) => {
            if (error) {
                req.logger.error(error);
                res.json({ 'message': 'erreur serveur' })
            } else {
                tousLesPrets = [];
                for (let key in result) {
                    let cur = result[key];
                    tousLesPrets.push({
                        'id': cur.id,
                        'user': {
                            'firstname': cur.firstname,
                            'lastname': cur.lastname,
                            'nick': cur.nick
                        },
                        'materiel': cur.materiel,
                        'dateDebut': cur.dateDebut,
                        'dateFin': cur.dateFin,
                        'moyenPaiement': cur.moyenPaiement
                    });
                }
                res.json({ 'prets': tousLesPrets });
            }
        });
};

exports.mesPrets = function (req, res) {
    req.database.query("SELECT date_debut as dateDebut, date_fin_attendue as dateFin, " +
        "moyen_paiement AS moyenPaiement, m.name as materiel " +
        "FROM pretCTN AS p" +
        "JOIN pretMateriel as m ON m.id  = p.id_materiel" +
        "WHERE id_user = ? " +
        "ORDER BY date_debut DESC;", [req.user.id], (error, result) => {
            if (error) {
                req.logger.error(error);
                res.json({ 'message': 'erreur serveur' })
            } else {
                tousLesPrets = [];
                for (let key in result) {
                    let cur = result[key];
                    tousLesPrets.push({
                        'materiel': cur.materiel,
                        'dateDebut': cur.dateDebut,
                        'dateFin': cur.dateFin,
                        'moyenPaiement': cur.moyenPaiement
                    });
                }
                res.json({ 'prets': tousLesPrets });
            }
        });
};

exports.lectureHistorique = function (req, res) { };
exports.suppressionHistorique = function (req, res) { };