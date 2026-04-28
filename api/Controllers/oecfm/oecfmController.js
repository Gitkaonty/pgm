// controllers/settingsController.js
const { QueryTypes } = require('sequelize');
const db = require("../../Models");
const settings = db.settings_ordre;
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Récupérer les infos
exports.getSettings = async (req, res) => {
    try {
        // 1. Récupérer les paramètres (avec sécurité si null)
        const data = await settings.findByPk(1);
        
        // Si data est null, on crée un objet vide pour éviter le crash au .toJSON()
        const settingsJson = data ? data.toJSON() : {};

        // 2. Requête SQL
        // Vérifie bien si ton objet s'appelle "db.sequelize" ou juste "sequelize"
        const queryResponsables = `
            SELECT 
                m.nom, m.prenom, u.poste
            FROM membresidentites m
            INNER JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND membre_active = 'Oui'
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE u.poste IN ('Président', 'Vice-Président Administratif', 'Secrétaire Général', 'Trésorier', 'Caissier')
        `;

        // Utilisation de db.sequelize si c'est ton import standard
        const responsables = await db.sequelize.query(queryResponsables, {
            type: db.sequelize.QueryTypes.SELECT
        });

        // 3. Organiser les noms des signataires
        const responsablesMap = {};
        if (responsables && responsables.length > 0) {
            responsables.forEach(r => {
                // On utilise le poste comme clé (ex: responsablesMap['Président'] = 'RAKOTO Jean')
                responsablesMap[r.poste] = `${r.nom} ${r.prenom}`;
            });
        }

        // 4. Fusionner et envoyer
        res.status(200).json({
            ...settingsJson,
            noms_signataires: responsablesMap
        });

    } catch (error) {
        console.error("Détail Erreur getSettings:", error); // Très important pour débugger
        res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
    }
};

// Mettre à jour les infos
exports.updateSettings = async (req, res) => {
    try {
        const [updated] = await settings.update(req.body, {
            where: { id: 1 }
        });
        if (updated) {
            const updatedData = await settings.findByPk(1);
            return res.status(200).json(updatedData);
        }
        throw new Error('Paramètres non trouvés');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSignatoriesByPoste = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id, 
                m.nom, 
                m.prenom, 
                u.poste
            FROM membresidentites m
            INNER JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id 
                AND membre_active = 'Oui'
                ORDER BY date_modification DESC LIMIT 1
            )
            WHERE u.poste IN ('Président', 'Secrétaire Général', 'Trésorier','Vice-Président Administratif','Caissier')
        `;
        
        const members = await db.sequelize.query(query, { type: QueryTypes.SELECT });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadSignature = async (req, res) => {
    try {
        const { poste } = req.params;
        if (!req.file) return res.status(400).json({ message: "Aucun fichier" });

        // On récupère le nom généré par le middleware
        const finalFileName = req.finalFileName || req.file.filename; 
        
        // CORRECTION DU CHEMIN : Bien vérifier le nombre de "../" 
        // pour sortir du dossier 'controllers' et atteindre 'uploads'
        const finalPath = path.join(__dirname, '../../uploads/signatures/', finalFileName);
        const tempPath = req.file.path;

        // Si le fichier existe déjà (créé par Multer), Sharp peut avoir un conflit
        // On traite l'image et on l'enregistre
        await sharp(tempPath)
            .png()
            .toFile(finalPath + '.tmp'); // On crée un temporaire pour éviter les conflits

        // On remplace le fichier final par le traité
        if (fs.existsSync(finalPath + '.tmp')) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); // Supprime le brut
            fs.renameSync(finalPath + '.tmp', finalPath); // Renomme le traité
        }

        let column = '';
        switch (poste) {
            case 'President': column = 'sig_president'; break;
            case 'Vice_President_Admin': column = 'sig_vice_president_admin'; break;
            case 'Secretaire': column = 'sig_secretaire'; break;
            case 'Tresorier': column = 'sig_tresorier'; break;
            case 'Caissier': column = 'sig_caissier'; break;
            default: return res.status(400).json({ message: "Poste invalide" });
        }

        // 1. RÉCUPÉRER L'ANCIEN NOM DE FICHIER
        const currentSettings = await settings.findByPk(1);
        const oldFileName = currentSettings ? currentSettings[column] : null;

        // 2. SUPPRIMER L'ANCIEN FICHIER (si différent du nouveau)
        if (oldFileName && oldFileName !== finalFileName) {
            const oldPath = path.join(__dirname, '../../uploads/signatures/', oldFileName);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // 3. METTRE À JOUR LA BASE DE DONNÉES
        await settings.update({ [column]: finalFileName }, { where: { id: 1 } });

        res.status(200).json({ message: "Signature mise à jour", fileName: finalFileName });
    } catch (error) {
        console.error("Détail de l'erreur:", error); // Pour voir l'erreur exacte dans ta console
        res.status(500).json({ message: "Erreur serveur lors du traitement" });
    }
};