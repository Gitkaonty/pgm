const db = require('../../Models');
const { Op } = require('sequelize');
const Membre = db.membres; // Supposant que tu as un modèle Membre
const exercice = db.exercices; // Supposant que tu as un modèle Exercice
const appel = db.appels;
const paiement = db.paiements;
const Attestation = db.attestations;
const membre = db.membres;
const user = db.users;

const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('fr-FR'); // Produit JJ/MM/AAAA
};

// Créer une nouvelle demande
exports.create = async (req, res) => {
    try {
        const { membre_id, exercice_id } = req.body;

        // 1. Récupérer les infos de l'exercice (notamment la date_fin)
        const exerciceData = await exercice.findByPk(exercice_id);
        if (!exerciceData) {
            return res.status(404).json({ message: "Exercice non trouvé." });
        }

        const date_fin = exerciceData.date_fin; // Assure-toi que le champ s'appelle bien ainsi dans ta table exercices
        const date_debut = exerciceData.date_debut;

        const dateDebut_formatted = formatDate(exerciceData.date_debut);
        const dateFin_formatted = formatDate(exerciceData.date_fin);
        const exercice_label = `${exerciceData.libelle}: ${dateDebut_formatted} - ${dateFin_formatted}`;

        // 2. Exécuter ta requête de jointure pour avoir la situation du membre à cette date précise
        const querySituation = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion, m.sexe,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe, u.poste, u.adresse
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE m.id = :membreId AND u.membre_active = 'Oui'
        `;

        const membresResult = await db.sequelize.query(querySituation, {
            replacements: { dateFin: date_fin, membreId: membre_id },
            type: db.sequelize.QueryTypes.SELECT
        });

        if (membresResult.length === 0) {
            return res.status(404).json({ message: "Membre non trouvé ou inactif à la date de fin d'exercice." });
        }

        //récupération du solde du membre
         const anouveauResult = await appel.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('appelnet')), 'totalAppel']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lte]: date_fin } // Filtre sur la date de fin < date début actuelle
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            where: { membre_id: membre_id, valide: true },
            raw: true
        });

        const anouveauResultPaiement = await paiement.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalPaiement']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lte]: date_fin } // Filtre sur la date de fin < date début actuelle
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            where: { membre_id: membre_id, valide: true },
            raw: true
        });

        const solde =parseFloat(anouveauResult[0]?.totalAppel || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0);

        //formatage du référence
        const annee = new Date(exerciceData.date_debut).getFullYear();
        const prefix = `/${annee}/PDT/SG`;

        // 2. Utilise le Modèle Paiement (Majuscule)
        const lastAttestation = await Attestation.findOne({
            where: { exercice_id: exercice_id }, // Vérifie si c'est exercice_id ou exerciceId en DB
            order: [['num_auto', 'DESC']]
        });

        // 3. Calcul sécurisé du nouveau numéro
        const nextSeq = lastAttestation ? (parseInt(lastAttestation.num_auto) + 1) : 1;

        // 4. FORMATAGE FINAL
        const formattedSeq = nextSeq.toString().padStart(3, '0');
        const referenceFinale = `A${formattedSeq}${prefix}`;

        const membreInfo = membresResult[0];

        // 3. Création du snapshot dans la table attestations
        const nouvelleAttestation = {
            membre_id: membre_id,
            exercice_id: exercice_id,
            matricule: membreInfo.matricule,
            nom: membreInfo.nom,
            prenom: membreInfo.prenom,
            sexe: membreInfo.sexe,
            section: membreInfo.section,
            titre: membreInfo.titre,
            statut: membreInfo.statut,
            poste: membreInfo.poste,
            adresse: membreInfo.adresse,
            date_adhesion: membreInfo.date_adhesion,
            exercice_label: exercice_label, 
            solde: solde,
            date_edition: new Date(),
            validation_1: false,
            validation_2: false,
            num_auto: nextSeq,
            num_attestation : referenceFinale,
            annee: annee
        };

        const result = await Attestation.create(nouvelleAttestation);
        res.status(201).json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la génération de la demande d'attestation." });
    }
};

// Récupérer toutes les attestations (pour l'affichage en front)
exports.findAll = async (req, res) => {
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

        const querySituation = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion, m.sexe,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe, u.poste, u.adresse
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE m.id = :membreId AND u.membre_active = 'Oui'
        `;

        const AttachedMember_Poste = await db.sequelize.query(querySituation, {
            replacements: { membreId: ConnectedMember_Id || 0 },
            type: db.sequelize.QueryTypes.SELECT
        });

        // On récupère tout, trié par date d'édition la plus récente
        const data = await Attestation.findAll({
            where: {...(!admin && { membre_id: ConnectedMember_Id || 0 })},
            order: [['date_edition', 'DESC'], ['id', 'DESC']]
        });
        
         res.status(200).json({
            data,
            poste: AttachedMember_Poste[0]?.poste || ""
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Erreur lors de la récupération." });
    }
};

// Supprimer une demande
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const attestation = await Attestation.findByPk(id);

        if (!attestation) {
            return res.status(404).json({ message: "Attestation introuvable." });
        }

        // Sécurité : Interdiction de supprimer si une validation a commencé
        if (attestation.validation_1 || attestation.validation_2) {
            return res.status(400).json({ 
                message: "Suppression impossible : le processus de validation est déjà engagé." 
            });
        }

        await attestation.destroy();
        res.status(200).json({ message: "Demande supprimée avec succès." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};

// Valider une étape
exports.validate = async (req, res) => {
    try {
        const { id } = req.params;
        const { step } = req.body; // 'step1' ou 'step2'
        
        const attestation = await Attestation.findByPk(id);
        if (!attestation) return res.status(404).json({ message: "Introuvable" });

        // if (step === 'step0') attestation.rejeter = true;
        // if (step === 'step1') attestation.validation_1 = true;
        // if (step === 'step2') attestation.validation_2 = true;

        if (step === 'step0') {
            attestation.rejeter = true;
            attestation.validation_1 = false;
            attestation.validation_2 = false;
        } 
        else if (step === 'step1') {
            attestation.validation_1 = true;
            attestation.rejeter = false; // Optionnel : on reset le flag rejet si on re-valide
        } 
        else if (step === 'step2') {
            attestation.validation_2 = true;
        }

        await attestation.save();
        res.status(200).json({ message: `Validation ${step} réussie`, data: attestation });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la validation" });
    }
};

// Valider une étape (V1 ou V2)
exports.validateStep = async (req, res) => {
    try {
        const { id } = req.params;
        const { step } = req.body; // On attend 1 ou 2

        const attestation = await Attestation.findByPk(id);

        if (!attestation) {
            return res.status(404).json({ message: "Attestation introuvable." });
        }

        if (step === 1) {
            attestation.rejeter = false;
            attestation.validation_1 = true;
        } else if (step === 2) {
            // Optionnel : On peut forcer que V1 soit fait avant V2
            if (!attestation.validation_1) {
                return res.status(400).json({ message: "La validation 1 doit être effectuée avant la validation 2." });
            }
            attestation.rejeter = false;
            attestation.validation_2 = true;
        } else {
            attestation.rejeter = true;
            attestation.validation_1 = false;
            attestation.validation_2 = false;
        }

        await attestation.save();
        
        res.status(200).json({ 
            message: `Validation ${step} enregistrée avec succès.`,
            data: attestation 
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la validation." });
    }
};