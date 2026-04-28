const db = require("../../Models");
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const path = require('path');
const membre = db.membres;
const paiement = db.paiements;
const exercice = db.exercices;
const emaillog = db.emaillogs;
const appel = db.appels;
const emaillogappel = db.emaillogsappels;
const TicketNoteTemplate = require('../../Utils/ticketNoteTemplante');
const { renderToStream } = require('@react-pdf/renderer');
const React = require('react');
const { renderToBuffer } = require('@react-pdf/renderer');

// Requête SQL pour la situation des membres (commune aux calculs)
const querySituation = `
    SELECT 
        m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
        u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id FROM membres_updates 
        WHERE membre_id = m.id AND date_modification <= :dateFin AND membre_active ='Oui'
        ORDER BY date_modification DESC, id DESC LIMIT 1
    )
    ORDER BY m.nom ASC
`;

// 1. RÉCUPÉRER LES APPELS EXISTANTS
exports.getAppelsByExercice = async (req, res) => {
    const { exerciceId } = req.params;
    try {
        // Récupération directe de la table sans aucune jointure
        const appels = await db.appels.findAll({
            where: { exercice_id: exerciceId },
            include: [
                {
                    model: db.membres,
                    as: 'membre',
                    attributes: ['matricule', 'nom', 'prenom', 'promotion'],
                    include: [
                        {
                            model: db.membres_updates,
                            as: 'membres_updates', // Vérifie l'alias dans ton modèle membres.js
                            attributes: ['telephone', 'date_modification'],
                            separate: false, // On veut une jointure gauche classique
                            limit: 1, // On essaie de limiter, mais attention au tri
                            order: [['date_modification', 'DESC'], ['id', 'DESC']]
                        },
                    ]
                },
                {
                    model: emaillogappel, // Référence à ta nouvelle table
                    as: 'email_logsappels',
                    attributes: ['id'] // On ne prend que l'ID pour optimiser la requête
                }
            ],
            order: [['id', 'ASC']]
        });

        // On renvoie les données telles quelles (ou presque) au DataGrid
        const formatted = appels.map(a => {
            // 1. On récupère l'objet membre extrait par la jointure
            // Sequelize le met souvent dans dataValues ou directement sur 'a'
            const infoMembre = a.membre || {};
            const autreInfos = a.membres_updates || {};
            // On récupère le téléphone dans le premier élément du tableau updates
            const derniereUpdate = (infoMembre.membres_updates && infoMembre.membres_updates[0]) || {};

            return {
                // --- DONNÉES À LA RACINE (pour le DataGrid) ---
                id: a.id,
                exercice_id: a.exercice_id,
                membre_id: a.membre_id,

                // On va chercher dans l'objet joint et on le remonte à la racine
                matricule: infoMembre.matricule || 'N/A',
                nom: infoMembre.nom || 'Inconnu',
                prenom: infoMembre.prenom || '',
                telephone: derniereUpdate.telephone || '-',
                // Données de situation (pour l'instant null d'après ton log)
                section: a.section || '-',
                statut: a.statut || '-',
                titre: a.titre || '-',
                associe: a.associe,
                montant: parseFloat(a.montant_du) || 0,
                total_ajustement: parseFloat(a.total_ajustement) || 0,
                appelnet: parseFloat(a.appelnet) || 0,
                regime: a.regime,
                promotion: infoMembre.promotion,
                valide: a.valide,
                date_appel: a.date_appel,
                num_note: a.num_note,
                nb_envois: a.email_logsappels ? a.email_logsappels.length : 0
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error("ERREUR GET APPELS:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. GÉNÉRER ET ENREGISTRER (Remplace generateAppelsBrouillon)
exports.generateAppelsBrouillon = async (req, res) => {
    const { exerciceId } = req.body;
    let transaction;

    try {
        transaction = await db.sequelize.transaction();

        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) throw new Error("Exercice non trouvé");

        // 1. Supprimer l'existant
        await db.appels.destroy({ where: { exercice_id: exerciceId }, transaction });

        // 2. Récupérer les membres et la grille
        const querySituationAppel = `
            SELECT m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                   u.section, u.statut, u.titre, u.nombre_associe
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE membre_active = 'Oui'
            ORDER BY m.nom ASC
        `;

        const [members, grille, ajustementsGroupes] = await Promise.all([
            db.sequelize.query(querySituationAppel, {
                replacements: { dateFin: exercice.date_fin },
                type: db.sequelize.QueryTypes.SELECT
            }),
            db.grille_tarifaires.findAll({ where: { exercice_id: exerciceId } }),
            db.ajustementappels.findAll({
                attributes: ['membre_id', [db.sequelize.fn('SUM', db.sequelize.col('montant_ajustement')), 'total_somme']],
                where: { exercice_id: exerciceId },
                group: ['membre_id'],
                raw: true
            })
        ]);

        // 3. Récupérer le dernier numéro de séquence (AWAIT ajouté)
        const lastRecord = await db.appels.findOne({
            where: { exercice_id: exerciceId },
            order: [['id', 'DESC']] // Ou un champ num_auto si tu en as un
        });

        let currentSeq = lastRecord && lastRecord.num_auto ? parseInt(lastRecord.num_auto) : 0;

        const yearDebut = new Date(exercice.date_debut).getFullYear();
        const yearFin = new Date(exercice.date_fin).getFullYear();

        // 4. Génération des records
        const records = members.map((m) => {
            let montant = 0;
            let regime = 0;
            const dateAdhesion = new Date(m.date_adhesion);
            const dateDebutEx = new Date(exercice.date_debut);
            const dateFinEx = new Date(exercice.date_fin);

            // Calcul du régime et tarif
            if (m.section === "Société Expert") {
                const nbr = m.nombre_associe || 0;
                const tarifMatch = grille.find(t =>
                    t.section === "Société Expert" && nbr >= t.nbr_associes_min && nbr <= t.nbr_associes_max
                );
                montant = tarifMatch ? tarifMatch.montant : 0;
                regime = 0;
            } else {
                if (dateAdhesion >= dateDebutEx && dateAdhesion <= dateFinEx) regime = 1;
                const tarifMatch = grille.find(t =>
                    t.section === m.section && t.titre === m.titre && t.statut === m.statut && t.regime === regime
                );
                montant = tarifMatch ? tarifMatch.montant : 0;
            }

            const ligneAjust = ajustementsGroupes.find(a => a.membre_id === m.id);
            const totalAjustement = ligneAjust ? parseFloat(ligneAjust.total_somme) : 0;

            // Gestion de l'incrément et de la référence
            currentSeq++;
            const formattedSeq = currentSeq.toString().padStart(3, '0');
            const referenceFinale = `SE${formattedSeq}/${yearDebut}_${yearFin}/TRS/VPA`;

            return {
                exercice_id: exerciceId,
                membre_id: m.id,
                section: m.section || '-',
                titre: m.titre || '-',
                statut: m.statut || '-',
                associe: m.nombre_associe || 0,
                montant_du: montant,
                total_ajustement: totalAjustement,
                appelnet: parseFloat(montant) + totalAjustement,
                regime: regime,
                valide: false,
                etat: 'En attente',
                num_note: referenceFinale,
                num_auto: currentSeq // On stocke l'incrément pour le prochain calcul
            };
        });

        await db.appels.bulkCreate(records, { transaction });
        await transaction.commit();
        res.json({ message: "Génération réussie" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("ERREUR GENERATION :", error);
        res.status(500).json({ message: error.message });
    }
};

// Exemple de logique Back (cotisation.controller.js)
exports.generateAppelsManuels = async (req, res) => {
    const { exerciceId, section, titre, statut, membre } = req.body;
    const transaction = await db.sequelize.transaction();

    try {
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) throw new Error("Exercice non trouvé");

        const querySituationAppel = `
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

        // 1. Récupérer la situation de tous les membres
        const allMembers = await db.sequelize.query(querySituationAppel, {
            replacements: { dateFin: exercice.date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        // 2. Appliquer les filtres
        const filteredMembers = allMembers.filter(m => {
            const matchSection = section === 'Toutes' || m.section === section;
            const matchTitre = titre === 'Toutes' || m.titre === titre;
            const matchStatut = statut === 'Toutes' || m.statut === statut;
            const matchMembre = membre === 'Tous' || m.id === parseInt(membre);
            return matchSection && matchTitre && matchStatut && matchMembre;
        });

        if (filteredMembers.length === 0) {
            throw new Error("Aucun membre ne correspond à ces filtres");
        }

        // 3. Identifier ceux qui ont déjà un appel
        const memberIds = filteredMembers.map(m => m.id);
        const existingAppels = await db.appels.findAll({
            where: {
                exercice_id: exerciceId,
                membre_id: memberIds
            },
            attributes: ['membre_id'],
            raw: true
        });

        const existingMemberIds = existingAppels.map(a => a.membre_id);

        // 4. Filtrer pour ne garder QUE ceux qui n'existent pas encore
        const membersToCreate = filteredMembers.filter(m => !existingMemberIds.includes(m.id));

        // Si tout le monde existe déjà, on informe l'utilisateur proprement (pas une erreur brute)
        if (membersToCreate.length === 0) {
            await transaction.rollback();
            return res.json({
                success: true,
                message: "Tous les membres sélectionnés possèdent déjà un appel. Aucune modification n'a été faite."
            });
        }

        // 3. Récupérer le dernier numéro de séquence (AWAIT ajouté)
        const lastRecord = await db.appels.findOne({
            where: { exercice_id: exerciceId },
            order: [['id', 'DESC']] // Ou un champ num_auto si tu en as un
        });

        let currentSeq = lastRecord && lastRecord.num_auto ? parseInt(lastRecord.num_auto) : 0;

        // On récupère les sommes groupées par membre
        const ajustementsGroupes = await db.ajustementappels.findAll({
            attributes: [
                'membre_id',
                [db.sequelize.fn('SUM', db.sequelize.col('montant_ajustement')), 'total_somme']
            ],
            where: { exercice_id: exerciceId },
            group: ['membre_id'],
            raw: true // Pour obtenir un objet JS simple
        });

        const grille = await db.grille_tarifaires.findAll({
            where: { exercice_id: exerciceId }
        });
        const dateDebutEx = new Date(exercice.date_debut);
        const dateFinEx = new Date(exercice.date_fin);

        const yearDebut = new Date(exercice.date_debut).getFullYear();
        const yearFin = new Date(exercice.date_fin).getFullYear();

        // 5. Préparer les nouveaux enregistrements
        const records = membersToCreate.map(m => {
            let montant = 0;
            let regime = 0;

            if (m.section === "Société Expert") {
                const nbr = m.nombre_associe || 0;
                const tarifMatch = grille.find(t =>
                    t.section === "Société Expert" && nbr >= t.nbr_associes_min && nbr <= t.nbr_associes_max
                );

                montant = tarifMatch ? tarifMatch.montant : 0;
            } else {
                const dateAdhesion = new Date(m.date_adhesion);
                if (dateAdhesion >= dateDebutEx && dateAdhesion <= dateFinEx) regime = 1;
                const tarifMatch = grille.find(t =>
                    t.section === m.section && t.titre === m.titre && t.statut === m.statut && t.regime === regime
                );
                montant = tarifMatch ? tarifMatch.montant : 0;
            }

            // On cherche si notre membre actuel a un total dans les ajustements récupérés
            const ligneAjust = ajustementsGroupes.find(a => a.membre_id === m.id);
            const totalAjustement = ligneAjust ? parseFloat(ligneAjust.total_somme) : 0;
            const appelNet = montant + totalAjustement;

            // Gestion de l'incrément et de la référence
            currentSeq++;
            const formattedSeq = currentSeq.toString().padStart(3, '0');
            const referenceFinale = `SE${formattedSeq}/${yearDebut}_${yearFin}/TRS/VPA`;

            return {
                exercice_id: exerciceId,
                membre_id: m.id,
                section: m.section,
                titre: m.titre,
                statut: m.statut,
                associe: m.nombre_associe,
                montant_du: montant,
                total_ajustement: totalAjustement,
                appelnet: appelNet,
                regime: regime,
                valide: false,
                etat: 'En attente',
                num_note: referenceFinale,
                num_auto: currentSeq
            };
        });

        // 6. Insertion
        await db.appels.bulkCreate(records, { transaction });
        await transaction.commit();

        // Message de succès détaillé
        let msg = `${records.length} nouvel/nouveaux appel(s) généré(s).`;
        if (existingMemberIds.length > 0) {
            msg += ` (${existingMemberIds.length} membres déjà présents ont été ignorés).`;
        }

        res.json({ message: msg });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Erreur génération manuelle :", error);
        res.status(500).json({ message: error.message });
    }
};

// 3. VALIDER LES APPELS (non utilisé)
exports.validerAppels = async (req, res) => {
    const { ids } = req.body; // Un tableau d'IDs [1, 2, 3...]
    try {
        await db.appels.update({ valide: true }, { where: { id: ids } });
        res.json({ message: "Appels validés" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. VALIDER LES APPELS
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { valide, type } = req.body;

        if (type === 'appels') {
            await db.appels.update({ valide }, { where: { id } });
            res.sendStatus(200);
        } else {
            await db.ajustementappels.update({ valide }, { where: { id } });
            res.sendStatus(200);
        }

    } catch (err) {
        res.status(500).json(err);
    }
};

// 3. VALIDER PLUSIEURS APPELS
exports.validerPlusieurs = async (req, res) => {
    const { ids } = req.body; // [1, 2, 5, ...]
    try {
        await db.appels.update(
            { valide: true },
            { where: { id: ids } } // Sequelize gère nativement le tableau d'IDs ici
        );
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Supprimer un appel spécifique par son ID
exports.deleteAppel = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await db.appels.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(200).json({ message: "Appel supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Appel non trouvé" });
        }
    } catch (error) {
        console.error("Erreur suppression appel:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};




//===================================================================================================================
//CODE POUR APPEL
//===================================================================================================================



// Génération des ajustements avec montant forfaitaire et filtres
exports.generateAjustements = async (req, res) => {
    const { exerciceId, montant, section, titre, statut, membre } = req.body;
    const transaction = await db.sequelize.transaction();

    try {
        // 1. Récupérer l'exercice pour avoir la date de fin
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        // Supprimer les brouillons existants pour cet exercice
        //await db.ajustementappels.destroy({ where: { exercice_id: exerciceId } });

        // 2. Exécuter ta requête SQL brute de situation
        // On utilise QueryTypes.SELECT pour avoir un tableau d'objets propre
        const situationMembres = await db.sequelize.query(`
            SELECT 
                m.id, m.matricule, m.nom, m.prenom,
                u.section, u.statut, u.titre
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE membre_active = 'Oui'
            ORDER BY m.nom ASC
        `, {
            replacements: { dateFin: exercice.date_fin },
            type: QueryTypes.SELECT
        });

        // 3. Filtrage JS (Simple et efficace)
        const membresFiltrés = situationMembres.filter(m => {
            const matchSection = section === "Toutes" || m.section === section;
            const matchTitre = titre === "Toutes" || m.titre === titre;
            const matchStatut = statut === "Toutes" || m.statut === statut;
            const matchMembre = membre === "Tous" || m.id === membre;
            return matchSection && matchTitre && matchStatut && matchMembre;
        });

        if (membresFiltrés.length === 0) {
            return res.status(400).json({ message: "Aucun membre ne correspond aux filtres." });
        }

        // 4. Préparer les objets pour l'insertion
        const dataAInserer = membresFiltrés.map(m => ({
            exercice_id: exerciceId, // vérifie si c'est exerciceId ou exercice_id dans ta base
            membre_id: m.id,
            // matricule: m.matricule,
            // nom: m.nom,
            // prenom: m.prenom,
            motif: m.motif || "n/a",
            section: m.section || "n/a",
            statut: m.statut || "n/a",
            titre: m.titre || "n/a",
            montant_ajustement: parseFloat(montant),
            valide: false,
            type_ajustement: "AJUSTEMENT",
            // createdAt: new Date(),
            // updatedAt: new Date()
        }));

        // 5. Insertion en masse avec Sequelize
        await db.ajustementappels.bulkCreate(dataAInserer);

        res.json({
            message: `${membresFiltrés.length} ajustements générés.`
        });

    } catch (error) {
        console.error("Erreur Backend:", error);
        res.status(500).json({ message: "Erreur serveur lors de la génération." });
    }
};

exports.getAjustementsByExercice = async (req, res) => {
    const { exerciceId } = req.params; // Récupéré depuis l'URL /ajustements/:exerciceId

    try {
        // 1. On récupère d'abord l'exercice pour avoir la date de fin (pour la situation)
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) return res.status(404).json({ message: "Exercice non trouvé" });

        // 2. On exécute la requête SQL pour récupérer les ajustements combinés aux infos membres
        // On joint 'ajustementappels' avec ta logique de situation
        const ajustements = await db.sequelize.query(`
            SELECT 
                a.id, a.exercice_id, a.membre_id, a.montant_ajustement, a.valide, a.type_ajustement,
                m.matricule, m.nom, m.prenom,
                u.section, u.statut, u.titre
            FROM ajustementappels a
            INNER JOIN membresidentites m ON a.membre_id = m.id
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE a.exercice_id = :exerciceId
            ORDER BY m.nom ASC
        `, {
            replacements: {
                dateFin: exercice.date_fin,
                exerciceId: exerciceId
            },
            type: QueryTypes.SELECT
        });

        // 3. Renvoi des données au Front (DataGrid)
        res.json(ajustements);

    } catch (error) {
        console.error("Erreur récupération ajustements:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des données." });
    }
};

// 3. VALIDER PLUSIEURS APPELS
exports.validerPlusieursAjustements = async (req, res) => {
    const { ids } = req.body; // [1, 2, 5, ...]
    try {
        await db.ajustementappels.update(
            { valide: true },
            { where: { id: ids } } // Sequelize gère nativement le tableau d'IDs ici
        );
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Supprimer un appel spécifique par son ID
exports.deleteAjustement = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await db.ajustementappels.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(200).json({ message: "Ajustement supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Ajustement non trouvé" });
        }
    } catch (error) {
        console.error("Erreur suppression Ajustement:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};

exports.getSyntheseReglementAppel = async (req, res) => {
    const { membreId, exerciceId, dateDebut } = req.query;

    try {
        // 1. Calcul des À-nouveaux (Passé)
        // Jointure entre Appels et Exercice
        const anouveauResult = await appel.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('appelnet')), 'totalAnouveau']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lt]: dateDebut } // Filtre sur la date de fin < date début actuelle
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            where: { membre_id: membreId, valide: true },
            raw: true
        });

        const anouveauResultPaiement = await paiement.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalPaiement']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lt]: dateDebut } // Filtre sur la date de fin < date début actuelle
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            where: { membre_id: membreId, valide: true },
            raw: true
        });

        // 2. Calcul des montants de l'exercice actuel
        // On récupère montant_du et total_ajustement pour l'exercice_id précis
        const paiementRecuAnnee = await paiement.sum('total', {
            where: {
                membre_id: membreId,
                exercice_id: exerciceId,
                valide: true
            }
        }) || 0;

        // 3. Réponse formatée pour le Front
        res.json({
            soldeAnouveau: parseFloat(anouveauResult[0]?.totalAnouveau || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0),
            paiementRecuAnnee: parseFloat(paiementRecuAnnee || 0),
        });

    } catch (error) {
        console.error("Erreur synthèse règlement:", error);
        res.status(500).send({ message: "Erreur lors du calcul des soldes." });
    }
};

const calculerDonneesSynthese = async (membreId, exerciceId, dateDebut) => {
    // Copie conforme de ta logique existante
    const anouveauResult = await db.appels.findAll({
        attributes: [[db.sequelize.fn('SUM', db.sequelize.col('appelnet')), 'totalAnouveau']],
        include: [{
            model: db.exercices, as: 'exercice',
            where: { date_fin: { [db.Sequelize.Op.lt]: dateDebut } },
            attributes: []
        }],
        where: { membre_id: membreId, valide: true },
        raw: true
    });

    const anouveauResultPaiement = await db.paiements.findAll({
        attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalPaiement']],
        include: [{
            model: db.exercices, as: 'exercice',
            where: { date_fin: { [db.Sequelize.Op.lt]: dateDebut } },
            attributes: []
        }],
        where: { membre_id: membreId, valide: true },
        raw: true
    });

    const paiementRecuAnnee = await db.paiements.sum('total', {
        where: { membre_id: membreId, exercice_id: exerciceId, valide: true }
    }) || 0;

    const soldeAnouveau = parseFloat(anouveauResult[0]?.totalAnouveau || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0);

    return {
        soldeAnouveau,
        paiementRecuAnnee: parseFloat(paiementRecuAnnee),
        totalAPayer: (soldeAnouveau - parseFloat(paiementRecuAnnee))
    };
};

const performEmailSending = async (appelId, dateFin) => {
    // 1. Récupération des données (ton code existant)
    // const p = await appel.findByPk(appelId, {
    //     include: [{ model: membre, as: 'membre', attributes: ['nom', 'prenom'] }]
    // });

    const p = await db.appels.findByPk(appelId, {
        include: [
            { model: db.membres, as: 'membre' },
            { model: db.exercices, as: 'exercice' }
        ]
    });

    if (p.valide) {
        const [mInfo] = await db.sequelize.query(`
        SELECT u.email_oecfm, u.telephone FROM membres_updates u 
        WHERE u.membre_id = :membreId AND u.date_modification <= :dateFin
        ORDER BY u.date_modification DESC, id DESC LIMIT 1
        `, { replacements: { membreId: p.membre_id, dateFin }, type: db.Sequelize.QueryTypes.SELECT });

        if (!mInfo?.email_oecfm) throw new Error("Email introuvable");
        const emailDestinataire = mInfo?.email_oecfm;

        // 2. Transporteur
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });

        const appUrl = "https://www.pgm-oecfm.mg";

        // 3. Calculer la synthèse SANS passer par une requête HTTP
        const synthese = await calculerDonneesSynthese(
            p.membre_id,
            p.exercice_id,
            p.exercice.date_debut
        );

        // 4. Générer le PDF
        const allExercices = await db.exercices.findAll();
        const pdfStream = await renderToStream(
            React.createElement(TicketNoteTemplate, {
                row: p,
                exercice: allExercices,
                synthese: {
                    anouveau: synthese.soldeAnouveau,
                    recuAnnee: synthese.paiementRecuAnnee,
                    // On ajoute l'appel actuel au total final
                    totalAPayer: synthese.totalAPayer + parseFloat(p.appelnet)
                },
                telephone: mInfo.telephone
            })
        );

        // 3. Envoi
        await transporter.sendMail({
            from: `"Comptabilité OECFM" <${process.env.SMTP_USER}>`,
            to: emailDestinataire,
            subject: `Facture d'appel de cotisation - N° ${p.num_note}`,
            attachments: [
                {
                filename: `Note_${p.num_note}.pdf`,
                content: pdfStream,
                contentType: 'application/pdf'
                },
                {
                    filename: 'logo500.png',
                    path: path.join(__dirname, '../../public/logo/logo500.png'),
                    cid: 'logo_oecfm'
                }
            ],
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                
                <div style="text-align: center; border-bottom: 2px solid #497a48; padding-bottom: 15px; margin-bottom: 20px;">
                    <div style="margin-bottom: 10px;">
                        <img 
                            src="cid:logo_oecfm" 
                            alt="OECFM" 
                            style="height: 35px; width: 35px; display: inline-block; vertical-align: middle;" 
                        />
                    </div>
                <h2 style="color: #497a48; margin: 0;">Appel de Cotisation</h2>
                    <p style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">Référence : ${p.num_note}</p>
                </div>
                
                <p>Bonjour <strong>${p.membre.prenom} ${p.membre.nom}</strong>,</p>
                
                <p>Nous vous adressons votre facture relative à l'appel de cotisation pour l'exercice en cours. Vous trouverez le document détaillé en pièce jointe de ce mail.</p>
                
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #497a48;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #64748b;">Date d'émission :</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: bold;">${new Date(p.date_appel).toLocaleDateString('fr-FR')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #64748b;">Montant total :</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #0f172a; font-size: 1.1rem;">
                                ${(parseFloat(p.appelnet)).toLocaleString('fr-FR')} Ar
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 0.9rem; color: #64748b;">
                    Vous pouvez également retrouver cette facture et l'historique de vos paiements en vous connectant à votre espace client sur la plateforme <strong>le portail de gestion des membres (PGM)</strong>.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl || '#'}" style="background-color: #4b967d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Accéder à mon espace
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                
                <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                    Ce mail est généré automatiquement par le service comptabilité de l'OECFM.<br/>
                    Merci de ne pas y répondre directement.
                </p>
            </div>
    `
        });

        // 4. Log succès
        return await emaillogappel.create({
            appel_id: p.id,
            membre_id: p.membre_id,
            email_dest: mInfo.email_oecfm,
            statut: 'Succès',
            date_envoi: new Date()
        });
    }

};

exports.sendPaiementEmail = async (req, res) => {
    const { id } = req.params;
    const { dateFin } = req.body; // Envoyer la date fin d'exercice depuis le front

    try {
        const result = await performEmailSending(id, dateFin);
        res.send({ message: "Email envoyé !" });
    } catch (error) {
        console.error("Erreur envoi mail:", error);

        // 6. Enregistrement dans l'historique (Échec)
        // On essaie de logger l'échec si on a au moins le paiement_id
        try {
            // await emaillog.create({
            //     paiement_id: id, 
            //     email_dest: "Inconnu",
            //     statut: 'Échec',
            //     message_erreur: error.message,
            //     date_envoi: new Date()
            // });
        } catch (logError) {
            console.error("Impossible de créer le log d'échec:", logError);
        }

        //res.status(500).send({ message: "Erreur lors de l'envoi de l'email." });
        res.status(500).send({ message: error.message });
    }
};

exports.sendBulkEmails = async (req, res) => {
    const { appelsIds, dateFin } = req.body;

    // Sécurité : vérifier si la liste n'est pas vide
    if (!appelsIds || !Array.isArray(appelsIds) || appelsIds.length === 0) {
        return res.status(400).send({ message: "Aucun paiement sélectionné." });
    }

    try {
        let successCount = 0;
        let errorCount = 0;

        // On boucle sur les IDs envoyés par le tableau React
        for (const id of appelsIds) {
            try {
                // On appelle ta fonction moteur interne
                await performEmailSending(id, dateFin);
                successCount++;
            } catch (err) {
                console.error(`Erreur sur paiement ID ${id}:`, err.message);

                // On log l'échec pour ce membre spécifique
                // await emaillog.create({
                //     paiement_id: id,
                //     email_dest : 'inconnu',
                //     statut: 'Échec',
                //     message_erreur: err.message,
                //     date_envoi: new Date()
                // });
                errorCount++;
            }
        }

        res.send({
            message: `Traitement terminé. Succès: ${successCount}, Échecs: ${errorCount}`
        });

    } catch (error) {
        console.error("Erreur globale Bulk:", error);
        res.status(500).send({ message: "Erreur lors du traitement groupé." });
    }
};

exports.getEmailLogs = async (req, res) => {
    try {
        const { appelsId } = req.params;

        // On cherche tous les logs liés à cet ID, triés du plus récent au plus ancien
        const logs = await emaillogappel.findAll({
            where: { appel_id: appelsId },
            order: [['date_envoi', 'DESC']]
        });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la récupération des logs",
            error: error.message
        });
    }
};