const db = require('../../Models');
const xlsx = require('xlsx');
const fs = require('fs');

const Membre = db.membres;
const user = db.users;

// Récupérer tout le monde
exports.getAllMembres = async (req, res) => {
    try {
        const ConnectedUserRoles =  req.roles;
        const ConnectedUser =req.user;
        let ConnectedMember_Id = 0;
        let admin =false;

        if([3355,5150].includes(ConnectedUserRoles)){
            admin =true;
        }

        const AttachedMember_ConnectedUser = await user.findByPk(ConnectedUser.userId, {
            attributes: ['membre_id'], // On ne demande que cette colonne
            raw: true                  // Retourne un objet JS simple au lieu d'une instance Sequelize
        });

        if(AttachedMember_ConnectedUser){
            ConnectedMember_Id = AttachedMember_ConnectedUser.membre_id;
        }

        const membres = await Membre.findAll({ 
            where : {...(!admin && { id: ConnectedMember_Id || 0 })},
            order: [['nom', 'ASC']] 
        });
        res.status(200).json(membres);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getAllMembresActive = async (req, res) => {
    try {
        const date_fin = req.params.id;

        const ConnectedUserRoles =  req.roles;
        const ConnectedUser =req.user;
        let ConnectedMember_Id = 0;
        let admin =false;

        if([3355,5150].includes(ConnectedUserRoles)){
            admin =true;
        }

        const AttachedMember_ConnectedUser = await user.findByPk(ConnectedUser.userId, {
            attributes: ['membre_id'], // On ne demande que cette colonne
            raw: true                  // Retourne un objet JS simple au lieu d'une instance Sequelize
        });

        if(AttachedMember_ConnectedUser){
            ConnectedMember_Id = AttachedMember_ConnectedUser.membre_id;
        }

        let querySituation ="";
        if(admin){
            querySituation = `
                SELECT 
                    m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                    u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
                FROM membresidentites m
                LEFT JOIN membres_updates u ON u.id = (
                    SELECT id FROM membres_updates 
                    WHERE membre_id = m.id AND date_modification <= :dateFin
                    ORDER BY date_modification DESC, id DESC LIMIT 1
                )
                WHERE membre_active = 'Oui'
                ORDER BY m.nom ASC
            `;
        }else{
            querySituation = `
                SELECT 
                    m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                    u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
                FROM membresidentites m
                LEFT JOIN membres_updates u ON u.id = (
                    SELECT id FROM membres_updates 
                    WHERE membre_id = m.id AND date_modification <= :dateFin
                    ORDER BY date_modification DESC, id DESC LIMIT 1
                )
                WHERE membre_active = 'Oui' AND m.id = :connected_Id
                ORDER BY m.nom ASC
            `;
        }
        

        const membres = await db.sequelize.query(querySituation, {
            replacements: { dateFin: date_fin, connected_Id : ConnectedMember_Id || 0},
            type: db.sequelize.QueryTypes.SELECT
        });

        res.status(200).json(membres);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getAllMembresActiveLastUpdate = async (req, res) => {
    try {
        const date_fin = req.params.id;

        const querySituation = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe, u.email_oecfm
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE membre_active = 'Oui'
            ORDER BY m.nom ASC
        `;

        const membres = await db.sequelize.query(querySituation, {
            replacements: { dateFin: date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        res.status(200).json(membres);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Créer un membre
exports.createMembre = async (req, res) => {
    try {
        const nouveauMembre = {
            matricule: req.body.matricule,
            nom: req.body.nom ? req.body.nom.toUpperCase() : '',
            prenom: req.body.prenom,
            sexe: req.body.sexe,
            cin: req.body.cin,
            date_naissance: req.body.date_naissance? req.body.date_naissance: null,
            // Nouveaux champs
            lieu_naissance: req.body.lieu_naissance,
            date_cin: req.body.date_cin? req.body.date_cin: null,
            lieu_cin: req.body.lieu_cin,
            date_adhesion: req.body.date_adhesion? req.body.date_adhesion: null,
            promotion: req.body.promotion,
            // Photo
            photo_url: req.file ? req.file.filename : null 
        };

        const data = await Membre.create(nouveauMembre);
        res.status(201).send(data);
    } catch (error) {
        console.error("Erreur Backend :", error);
        res.status(500).send({ message: error.message || "Erreur lors de l'enregistrement" });
    }
};

// Modifier
exports.updateMembre = async (req, res) => {
    const id = req.params.id;
    try {
        await Membre.update(req.body, { where: { id: id } });
        res.send({ message: "Membre mis à jour !" });
    } catch (error) {
        res.status(500).send({ message: "Erreur de mise à jour" });
    }
};

// Supprimer
exports.deleteMembre = async (req, res) => {
    const id = req.params.id;
    try {
        await Membre.destroy({ where: { id: id } });
        res.send({ message: "Supprimé avec succès" });
    } catch (error) {
        res.status(500).send({ message: "Erreur de suppression" });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier téléchargé" });
        }

        const newPhotoUrl = req.file.filename;

        // Exemple si tu utilises Sequelize pour Kaonty :
        // await Membre.update({ photo_url: newPhotoUrl }, { where: { id: id } });
        
        // Si tu utilises du SQL pur ou un autre ORM, adapte la requête ici.
        // L'objectif est de mettre à jour le champ 'photo_url' du membre qui a cet 'id'.

        res.status(200).json({ 
            message: "Photo mise à jour avec succès", 
            photo_url: newPhotoUrl 
        });
    } catch (error) {
        console.error("Erreur uploadPhoto:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'upload" });
    }
};

//importer un fichier Excel
exports.importExcel = async (req, res) => {
    const filePath = req.file?.path;

    try {
        if (!req.file) return res.status(400).json({ message: "Fichier manquant" });

        const workbook = xlsx.readFile(filePath, { cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // On récupère les dates proprement en objets JS
        const data = xlsx.utils.sheet_to_json(worksheet, { 
            cellDates: true,
            raw: false // raw: false permet de récupérer le formatage si besoin, 
                       // mais avec cellDates: true, les colonnes dates deviennent des objets Date.
        });

        const values = data.map(m => {
            const row = {};
            // On nettoie les noms de colonnes de l'Excel (minuscules, pas d'espaces)
            Object.keys(m).forEach(key => {
                row[key.trim().toLowerCase()] = m[key];
            });

            // On construit le tableau selon l'ordre EXACT de ta requête SQL ci-dessous
            return {
                matricule: row.matricule,
                nom: row.nom,
                prenom: row.prenoms || row.prenom,
                sexe: row.sexe,
                cin: row.cin,
                promotion: row.promotion,
                date_adhesion: row.date_adhesion? row.date_adhesion: null,
                date_naissance: row.date_naissance? row.date_naissance: null,
                lieu_naissance: row.lieu_naissance,
                date_cin: row.date_cin? row.date_cin: null,
                lieu_cin: row.lieu_cin
                // Ne mettez PAS de createdAt/updatedAt ici si vous avez mis timestamps: false
            };
        });

        await db.membres.bulkCreate(values, {
            validate: true, 
            timestamps: false
        });

        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ message: `${values.length} membres importés avec succès.` });

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        
        // REGARDE TON TERMINAL : L'erreur exacte s'affichera ici
        console.error("ERREUR SQL COMPLETE :", error); 
        
        res.status(500).json({ 
            message: "Erreur SQL : " + (error.sqlMessage || "Structure invalide ou date incorrecte") 
        });
    }
};