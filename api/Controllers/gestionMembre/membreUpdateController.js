const db = require('../../Models');
const xlsx = require('xlsx');
const fs = require('fs');
const { Op } = require('sequelize');

const MembreUpdate = db.membres_updates;
const MembreIdentite = db.membres;

exports.getAllUpdates = async (req, res) => {
    try {
        const query = `
            SELECT 
                mu.*, 
                CONCAT(mi.nom, ' ', mi.prenom) as membre_nom_complet
            FROM membres_updates mu
            LEFT JOIN membresidentites mi ON mu.membre_id = mi.id
            ORDER BY mi.nom ASC
        `;
        
        const [rows] = await db.sequelize.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erreur SQL Jointure:", error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.createUpdate = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.id;
        delete data.isNew;
        delete data.membre_nom_complet;

        // Avec Sequelize, on utilise le modèle directement
        const newRow = await MembreUpdate.create(data);

        if (req.file) {
            // Option A : Si vous stockez uniquement le nom du fichier original (ex: "photo.jpg")
            const nomFichier = req.file.filename; 
            
            // Option B : Si vous stockez le chemin relatif (ex: "uploads/membres/photo.jpg")
            // const nomFichier = req.file.path; 

            // On met à jour la table principale grâce au membre_id présent dans data
            await MembreIdentite.update(
                { photo_url: nomFichier }, // Le nom du champ dans votre table membresidentites
                { where: { id: data.membre_id } } // Assurez-vous que le champ s'appelle bien "membre_id" ou "id" selon votre structure
            );
        }

        res.status(201).json(newRow);
    } catch (error) {
        console.error("ERREUR CREATE :", error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.updateRow = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const row_Id = data.id;

    delete data.id;
    delete data.matricule;
    delete data.nom;
    delete data.prenom;
    delete data.sexe;
    delete data.cin;
    delete data.date_naissance;
    delete data.lieu_naissance;
    delete data.date_cin;
    delete data.lieu_cin;
    delete data.date_adhesion;
    delete data.promotion;

    // On force la mise à jour
    const [updated] = await MembreUpdate.update(data, {
      where: { id: row_Id }
    });

    if (req.file) {
        // Option A : Si vous stockez uniquement le nom du fichier original (ex: "photo.jpg")
        const nomFichier = req.file.filename; 
        
        // Option B : Si vous stockez le chemin relatif (ex: "uploads/membres/photo.jpg")
        // const nomFichier = req.file.path; 

        // On met à jour la table principale grâce au membre_id présent dans data
        await MembreIdentite.update(
            { photo_url: nomFichier }, // Le nom du champ dans votre table membresidentites
            { where: { id: data.membre_id } } // Assurez-vous que le champ s'appelle bien "membre_id" ou "id" selon votre structure
        );
    }

    if (updated) {
      const updatedRow = await MembreUpdate.findByPk(id);
      //console.log("Ligne mise à jour en base :", updatedRow.toJSON());
      return res.status(200).json(updatedRow);
    }
    
    //throw new Error('Ligne non trouvée');
  } catch (error) {
    console.error("ERREUR UPDATE BACKEND :", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUpdate = async (req, res) => {
  try {
      const { id } = req.params;
      await MembreUpdate.destroy({ where: { id: id } });
      res.status(200).json({ message: "Supprimé", id });
  } catch (error) {
      console.error("ERREUR DELETE :", error.message);
      res.status(500).json({ message: error.message });
  }
};

// Fonction pour convertir le format nombre Excel en Date JS
const excelDateToJSDate = (serial) => {
   if (!serial || isNaN(serial)) return new Date().toISOString().split('T')[0];
   const utc_days  = Math.floor(serial - 25569);
   const utc_value = utc_days * 86400;
   const date_info = new Date(utc_value * 1000);
   return date_info.toISOString().split('T')[0];
};

exports.importExcelUpdate = async (req, res) => {
    const filePath = req.file?.path;

    try {
        if (!req.file) return res.status(400).json({ message: "Fichier manquant" });

        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet, { cellDates: true });

        if (data.length === 0) {
            throw new Error("Le fichier Excel est vide.");
        }

        // 1. Collecter tous les matricules uniques du fichier Excel
        const excelMatricules = [...new Set(
            data.map(m => {
                const val = m.membre_id || m.matricule;
                return val ? String(val).trim() : null;
            }).filter(id => id !== null)
        )];

        // 2. Récupérer les ID et Matricules correspondants dans la base
        const membresEnBase = await MembreIdentite.findAll({
            where: { matricule: excelMatricules },
            attributes: ['id', 'matricule'], // On récupère l'ID technique ici
            raw: true
        });

        // Créer un dictionnaire pour une recherche rapide : { "163": 12, "55": 45, ... }
        const mapMatriculeToId = {};
        membresEnBase.forEach(m => {
            mapMatriculeToId[String(m.matricule).trim()] = m.id;
        });

        // Vérifier s'il y a des matricules inexistants
        const matriculesTrouves = Object.keys(mapMatriculeToId);
        const matriculesInexistants = excelMatricules.filter(id => !matriculesTrouves.includes(id));

        if (matriculesInexistants.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ 
                message: `Importation annulée. Les matricules suivants n'existent pas : ${matriculesInexistants.join(', ')}` 
            });
        }

        // 3. Préparation des données pour l'insertion
        const today = new Date().toISOString().split('T')[0];
        
        const values = data.map(row => {
            const cleanRow = {};
            Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

            const matricule = String(cleanRow.membre_id || cleanRow.matricule).trim();

            return {
                date_edition: today,
                date_modification: typeof cleanRow.date_modification === 'number' 
                    ? excelDateToJSDate(cleanRow.date_modification) 
                    : (cleanRow.date_modification || today),
                // On utilise l'ID technique trouvé via le dictionnaire
                membre_id: mapMatriculeToId[matricule], 
                
                // Normalisation des ENUM (Première lettre en Majuscule)
                membre_active: cleanRow.membre_active 
                    ? (cleanRow.membre_active.charAt(0).toUpperCase() + cleanRow.membre_active.slice(1).toLowerCase()) 
                    : 'Oui',
                situation: cleanRow.situation 
                    ? (cleanRow.situation.charAt(0).toUpperCase() + cleanRow.situation.slice(1)) 
                    : 'En activité',
                
                section: cleanRow.section || null,
                statut: cleanRow.statut || null,
                titre: cleanRow.titre || null,
                diplome: cleanRow.diplome || null,
                email_oecfm: cleanRow.email_oecfm || null,
                adresse: cleanRow.adresse || null,
                ville: cleanRow.ville || null,
                code_postal: cleanRow.code_postal || null,
                boite_postale: cleanRow.boite_postale || null,
                telephone: cleanRow.telephone || null,
                fax: cleanRow.fax || null,
                email_personnel: cleanRow.email_personnel || null,
                email_professionnel: cleanRow.email_professionnel || null,
                poste: cleanRow.poste || null,
                region: cleanRow.region || null,
                num_compte: cleanRow.num_compte || null,
                nombre_associe: cleanRow.nombre_associe || 0
            };
        });

        // 4. Insertion groupée

        await MembreUpdate.bulkCreate(values, { timestamps: true });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ message: `${values.length} mises à jour importées avec succès.` });

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error("Erreur Import Update:", error);
        res.status(500).json({ message: error.message || "Erreur lors de l'importation" });
    }
};

exports.getMembreLastUpdate = async (req, res) => {
  try {
    const { membre_id } = req.params;

    const query = `
    SELECT 
        u.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.cin,
        m.date_naissance,
        m.lieu_naissance,
        m.date_cin,
        m.lieu_cin,
        m.date_adhesion,
        m.promotion,
        m.photo_url, -- Ajout de la photo depuis la table identité
        u.date_edition,
        u.diplome,
        u.date_modification,
        u.membre_active, 
        u.situation, 
        u.section, 
        u.statut, 
        u.titre,
        u.email_oecfm,
        u.adresse,
        u.ville,
        u.code_postal,
        u.boite_postale,
        u.telephone,
        u.fax,
        u.email_personnel,
        u.email_professionnel,
        u.poste,
        u.region,
        u.num_compte,
        u.nombre_associe
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE m.id = :membre_id
    ORDER BY m.nom ASC
    `;

    const lastData = await db.sequelize.query(query, {
        replacements: { membre_id: membre_id },
        type: db.sequelize.QueryTypes.SELECT
    });

    res.json(lastData);
  } catch (error) {
    console.error("Erreur Situation Membre:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la situation" });
  }
};

exports.getHistoriqueMembre = async (req, res) => {
  try {
    const { membre_id } = req.params;

    // On récupère toutes les lignes de la table membres_updates pour ce membre
    // On trie par date la plus récente en premier
    const historique = await db.membres_updates.findAll({
      where: { 
        membre_id: membre_id 
      },
      attributes: ['id', 'date_modification'], // On ne prend que ce qui est utile pour le menu
      order: [['date_modification', 'DESC'], ['id', 'DESC']]
    });

    // On renvoie directement le tableau des dates
    res.json(historique);

  } catch (error) {
    console.error("Erreur Historique Membre:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
};

exports.getMembreByDateInfos = async (req, res) => {
  try {
    const { membre_id, date_modif } = req.params;

    const query = `
    SELECT 
        u.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.cin,
        m.date_naissance,
        m.lieu_naissance,
        m.date_cin,
        m.lieu_cin,
        m.date_adhesion,
        m.promotion,
        m.photo_url, -- Ajout de la photo depuis la table identité
        u.date_edition,
        u.diplome,
        u.date_modification,
        u.membre_active, 
        u.situation, 
        u.section, 
        u.statut, 
        u.titre,
        u.email_oecfm,
        u.adresse,
        u.ville,
        u.code_postal,
        u.boite_postale,
        u.telephone,
        u.fax,
        u.email_personnel,
        u.email_professionnel,
        u.poste,
        u.region,
        u.num_compte,
        u.nombre_associe
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id AND date_modification = :date_modif
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE m.id = :membre_id 
    ORDER BY m.nom ASC
    `;

    const lastData = await db.sequelize.query(query, {
        replacements: { membre_id: membre_id ,date_modif:date_modif},
        type: db.sequelize.QueryTypes.SELECT
    });

    res.json(lastData);
  } catch (error) {
    console.error("Erreur Situation Membre:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la situation" });
  }
};

exports.updateHistoriqueMembre = async (req, res) => {
  try {
    const { id } = req.params; // C'est l'ID de la ligne membres_updates
    const updateData = req.body;

    // On met à jour directement la ligne avec cet ID
    // const [updatedRows] = await db.membres_updates.update(updateData, {
    //   where: { id: id }
    // });

    // if (updatedRows === 0) {
    //   return res.status(404).json({ message: "Version introuvable" });
    // }

    // res.json({ message: "Version mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur PUT MembreUpdate:", error);
    res.status(500).json({ message: "Erreur lors de la modification" });
  }
};

exports.deleteHistoriqueMembre = async (req, res) => {
  try {
    const { id } = req.params; // ID de la ligne dans membres_updates

    const deleted = await db.MembreUpdate.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({ message: "Version non trouvée" });
    }

    res.json({ message: "Version supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE MembreUpdate:", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
};

exports.getMembreHistorique = async (req, res) => {
  try {
    const { id } = req.params;

    const historique = await db.membres_updates.findAll({
      where: { 
        membre_id: id 
      },
      order: [['date_modification', 'DESC'], ['id', 'DESC']]
    });
    
    res.json(historique);
  } catch (error) {
    console.error("Erreur Situation Membre:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la situation" });
  }
};