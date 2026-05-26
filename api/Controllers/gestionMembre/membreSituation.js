// controllers/membreSituationController.js
const db = require('../../Models');
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');

const getMembreSituation = async (req, res) => {
  try {
    const { dateFin } = req.query; // Récupéré depuis le front

    if (!dateFin) {
      return res.status(400).json({ message: "La date de fin est requise" });
    }

    const query = `
    SELECT 
        m.id, 
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
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    )
    ORDER BY m.nom ASC
    `;

    const situations = await db.sequelize.query(query, {
      replacements: { dateFin: dateFin },
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(situations);
  } catch (error) {
    console.error("Erreur Situation Membre:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la situation" });
  }
};

const getInfosTableauAnnuel = async (req, res) => {
  const { dateFin } = req.query; // Récupéré depuis le front

  if (!dateFin) {
    return res.status(400).json({ message: "La date de fin est requise" });
  }

  const queryPoste = `
    SELECT 
        m.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.promotion,
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
        u.region
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id 
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE u.poste = :poste AND u.membre_active='Oui'
    ORDER BY m.nom ASC
    `;

    const queryTableauAAnalamanga = `
    SELECT 
        m.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.promotion,
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
        u.region
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id 
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE u.titre = 'Tableau A' AND u.region = 'Analamanga' AND u.section = 'Expert Comptable' AND u.membre_active='Oui'
    ORDER BY m.nom ASC
    `;

    const queryTableauAAutre = `
    SELECT 
        m.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.promotion,
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
        u.region
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id 
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE u.titre = 'Tableau A' AND u.region != 'Analamanga' AND u.section = 'Expert Comptable' AND u.membre_active='Oui'
    ORDER BY m.nom ASC
    `;

    const queryTableauB = `
    SELECT 
        m.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.promotion,
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
        u.region
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id 
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE u.titre = 'Tableau B' AND u.section = 'Expert Comptable' AND u.membre_active='Oui'
    ORDER BY m.nom ASC
    `;

    const queryTableauSociete = `
    SELECT 
        m.id, 
        m.matricule, 
        m.nom, 
        m.prenom,
        m.sexe,
        m.promotion,
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
        u.region
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id 
        FROM membres_updates 
        WHERE membre_id = m.id 
            AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC
        LIMIT 1
    ) WHERE u.section = 'Société Expert' AND u.membre_active='Oui'
    ORDER BY m.nom ASC
    `;

  // On regroupe les requêtes lourdes dans le Promise.all existant
  const [conseillers, president, presidentHonneur, secretaireG, secretaireGA, tresorier, vicePDA, vicePDT, regionAnalamanga, regionAutre, titreB, sectionSociete] = await Promise.all([
    // 1. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Conseiller' },
      type: QueryTypes.SELECT
    }),

    // 2. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Président' },
      type: QueryTypes.SELECT
    }),

    // 3. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Président d honneur' },
      type: QueryTypes.SELECT
    }),

    // 4. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Secrétaire Général' },
      type: QueryTypes.SELECT
    }),

    // 5. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Secrétaire Général Adjoint' },
      type: QueryTypes.SELECT
    }),

    // 6. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Trésorier' },
      type: QueryTypes.SELECT
    }),

    // 7. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Vice-Président Administratif' },
      type: QueryTypes.SELECT
    }),

    // 8. 
    db.sequelize.query(queryPoste , {
      replacements: { dateFin: dateFin, poste: 'Vice-Président Technique' },
      type: QueryTypes.SELECT
    }),

    // 9. tableau A - Analamanga
    db.sequelize.query(queryTableauAAnalamanga , {
      replacements: { dateFin: dateFin },
      type: QueryTypes.SELECT
    }),

    // 10. tableau A - Autres regions
    db.sequelize.query(queryTableauAAutre , {
      replacements: { dateFin: dateFin },
      type: QueryTypes.SELECT
    }),

    // 11. tableau B
    db.sequelize.query(queryTableauB , {
      replacements: { dateFin: dateFin },
      type: QueryTypes.SELECT
    }),

    // 12. section société
    db.sequelize.query(queryTableauSociete , {
      replacements: { dateFin: dateFin },
      type: QueryTypes.SELECT
    }),
  ]);

  // Envoi final des données structurées pour le Front
  res.status(200).json({
    conseillers: conseillers || [], 
    president: president || [], 
    presidentHonneur: presidentHonneur || [], 
    secretaireG: secretaireG || [], 
    secretaireGA: secretaireGA || [], 
    tresorier: tresorier || [], 
    vicePDA: vicePDA || [], 
    vicePDT: vicePDT || [], 
    regionAnalamanga: regionAnalamanga || [], 
    regionAutre: regionAutre || [], 
    titreB: titreB || [],
    sectionSociete: sectionSociete || []
  });
};

module.exports = { getMembreSituation, getInfosTableauAnnuel };