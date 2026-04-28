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
            ORDER BY mu.date_edition DESC
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

    // On force la mise à jour
    const [updated] = await MembreUpdate.update(data, {
      where: { id: id }
    });

    if (updated) {
      const updatedRow = await MembreUpdate.findByPk(id);
      //console.log("Ligne mise à jour en base :", updatedRow.toJSON());
      return res.status(200).json(updatedRow);
    }
    
    throw new Error('Ligne non trouvée');
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

        console.log(values);

        await MembreUpdate.bulkCreate(values, { timestamps: true });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ message: `${values.length} mises à jour importées avec succès.` });

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error("Erreur Import Update:", error);
        res.status(500).json({ message: error.message || "Erreur lors de l'importation" });
    }
};