// controllers/membreSituationController.js
const db = require('../../Models');

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

module.exports = { getMembreSituation };