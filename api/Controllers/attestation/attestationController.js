const db = require('../../Models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const path = require('path');
const Membre = db.membres; // Supposant que tu as un modèle Membre
const exercice = db.exercices; // Supposant que tu as un modèle Exercice
const appel = db.appels;
const paiement = db.paiements;
const Attestation = db.attestations;
const membre = db.membres;
const user = db.users;
const appUrl = process.env.APP_URL || "https://www.pgm.oecfm.mg";

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

        const solde = parseFloat(anouveauResult[0]?.totalAppel || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0);

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
            validation_0: solde > 0 ? false : true,
            validation_1: false,
            validation_2: false,
            num_auto: nextSeq,
            num_attestation: referenceFinale,
            annee: annee
        };

        const result = await Attestation.create(nouvelleAttestation);

        //ENVOI EMAIL POUR NOTIFICATION
        // 2. Exécuter ta requête de jointure pour avoir la situation du membre à cette date précise
        const queryRecupSecretaireGen = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion, m.sexe, u.email_oecfm,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe, u.poste, u.adresse
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE u.poste = 'Secrétaire Général' AND u.membre_active = 'Oui'
        `;

        const queryRecupPresident = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion, m.sexe, u.email_oecfm,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe, u.poste, u.adresse
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE u.poste = 'Président' AND u.membre_active = 'Oui'
        `;

        const secretaireGen = await db.sequelize.query(queryRecupSecretaireGen, {
            replacements: { dateFin: date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        let emailSecretaireGen = '';
        if (secretaireGen && secretaireGen.length > 0) {
            emailSecretaireGen = secretaireGen[0].email_oecfm;
        }

        const president = await db.sequelize.query(queryRecupPresident, {
            replacements: { dateFin: date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        let emailPresident = '';
        if (president && president.length > 0) {
            emailPresident = president[0].email_oecfm;
        }

        //récupération adresse mail admin et superAdmin
        const admins = await db.users.findAll({
            attributes: ['email'], // On ne récupère que l'email
            include: [{
                model: db.roles,
                as: 'role', // Utilise l'alias défini dans tes associations (souvent 'Role')
                where: {
                    code: {
                        [Op.in]: ['5150', '3355']
                    }
                },
                attributes: [] // On ne veut pas les colonnes de la table Role dans le résultat
            }],
            raw: true // Pour obtenir un tableau d'objets simples
        });

        const emailsAdmins = admins.map(u => u.email);

        if (emailSecretaireGen) {
            emailsAdmins.push(emailSecretaireGen);
        }

        // Optionnel : Retirer les doublons au cas où le Secrétaire Général est aussi Admin
        const destinatairesUniques = [...new Set(emailsAdmins)];

        const destinatairesCCUniques = [...new Set(destinatairesUniques)].filter(email => email !== emailSecretaireGen);

        const destinatairesSeretaireUnique = [...new Set(destinatairesCCUniques)].filter(email => email !== emailPresident);

        //const appUrl = process.env.APP_URL || "https://www.pgm-oecfm.mg"; // Exemple d'URL

        // 2. Transporteur
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
            // On envoie à la liste groupée (Admins + Secrétaire Général)
            from: `"Administration OECFM" <${process.env.SMTP_USER}>`,
            to: destinatairesSeretaireUnique.join(', '),
            //cc: destinatairesCCUniques.join(', '), // Envoi groupé ou boucle selon ton besoin
            subject: `Nouvelle demande d'attestation - ${referenceFinale} - ${membreInfo.nom} ${membreInfo.prenom}`,
            attachments: [
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
                        <img src="cid:logo_oecfm" alt="OECFM" style="max-height: 50px; width: auto;" />
                    </div>
                    <h2 style="color: #497a48; margin: 0;">Notification de Demande d'Attestation</h2>
                </div>
                
                <p>Bonjour,</p>
                
                <p>Une nouvelle demande d'attestation a été générée sur la plateforme. Voici les détails du membre concerné :</p>
                
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <h3 style="color: #497a48; margin-top: 0; font-size: 1.1rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Détails de l'Attestation</h3>
                    <p style="margin: 8px 0;"><strong>N° Attestation :</strong> <span style="color: #2563eb;">${referenceFinale}</span></p>
                    <p style="margin: 8px 0;"><strong>Exercice :</strong> ${exercice_label}</p>
                    <p style="margin: 8px 0;"><strong>Date d'édition :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>

                    <h3 style="color: #497a48; margin-top: 20px; font-size: 1.1rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Informations du Membre</h3>
                    <p style="margin: 5px 0;"><strong>Matricule :</strong> ${membreInfo.matricule}</p>
                    <p style="margin: 5px 0;"><strong>Nom :</strong> ${membreInfo.nom}</p>
                    <p style="margin: 5px 0;"><strong>Prénoms :</strong> ${membreInfo.prenom}</p>
                    <p style="margin: 5px 0;"><strong>Section :</strong> ${membreInfo.section}</p>
                    <p style="margin: 5px 0;"><strong>Statut :</strong> ${membreInfo.statut}</p>
                    <p style="margin: 5px 0;"><strong>Titre :</strong> ${membreInfo.titre}</p>
                </div>

                <p>Cette demande est en attente de traitement dans votre tableau de bord administratif.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/attestation/validation" style="background-color: #497a48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Consulter la demande
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                
                <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                    Ceci est un message automatique généré par le système **PGM - oecfm**.<br/>
                    <strong>Ordre des Experts Comptables et Financiers de Madagascar</strong>
                </p>
            </div>
            `
        });

        res.status(201).json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la génération de la demande d'attestation." });
    }
};

// Récupérer toutes les attestations (pour l'affichage en front)
exports.findAll = async (req, res) => {
    try {
        const ConnectedUserRoles = req.roles;
        const ConnectedUser = req.user;
        let ConnectedMember_Id = 0;
        let admin = false;

        if ([3355, 5150].includes(ConnectedUserRoles)) {
            admin = true;
        }

        const AttachedMember_ConnectedUser = await user.findByPk(ConnectedUser.userId, {
            attributes: ['membre_id'], // On ne demande que cette colonne
            raw: true                  // Retourne un objet JS simple au lieu d'une instance Sequelize
        });

        if (AttachedMember_ConnectedUser) {
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
            where: { ...(!admin && { membre_id: ConnectedMember_Id || 0 }) },
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
        const { step } = req.body;

        const attestation = await Attestation.findByPk(id);
        if (!attestation) {
            return res.status(404).json({ message: "Attestation introuvable." });
        }

        const exerciceData = await exercice.findByPk(attestation.exercice_id);
        if (!exerciceData) {
            return res.status(404).json({ message: "Exercice non trouvé." });
        }

        const date_fin = exerciceData.date_fin; // Assure-toi que le champ s'appelle bien ainsi dans ta table exercices
        const date_debut = exerciceData.date_debut;

        // --- LOGIQUE DE VALIDATION ---
        if (step === 1) {
            attestation.rejeter = false;
            attestation.validation_1 = true;
        } else if (step === 2) {
            if (!attestation.validation_1) {
                return res.status(400).json({ message: "La validation 1 doit être effectuée avant la validation 2." });
            }
            attestation.rejeter = false;
            attestation.validation_2 = true;
        } else if (step === 3) {
            // if (attestation.rejeter) {
            //     return res.status(400).json({ message: "L'attestation est rejetée" });
            // }
            
            attestation.rejeter = false;
            attestation.validation_0 = true;
            attestation.validation_1 = false;
            attestation.validation_2 = false;
        } else if (step === 0){
            attestation.rejeter = true;
            attestation.validation_1 = false;
            attestation.validation_2 = false;
        }

        await attestation.save();

        // --- RÉCUPÉRATION DES EMAILS (Correction date_fin et SQL) ---
        // On utilise la date d'édition de l'attestation pour le filtre historique
        const dateRef = attestation.date_edition;

        const queryByPoste = (poste) => `
            SELECT u.email_oecfm
            FROM membres_updates u
            WHERE u.poste = :poste 
              AND u.membre_active = 'Oui'
              AND u.date_modification <= :dateRef
            ORDER BY u.date_modification DESC, u.id DESC LIMIT 1
        `;

        const [secGenData] = await db.sequelize.query(queryByPoste('Secrétaire Général'), {
            replacements: { poste: 'Secrétaire Général', dateRef: date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        const [presidData] = await db.sequelize.query(queryByPoste('Président'), {
            replacements: { poste: 'Président', dateRef: date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        const emailSecretaireGen = secGenData ? secGenData.email_oecfm : '';
        const sexeSecretaireGen = secGenData ? secGenData.sexe : '';
        const emailPresident = presidData ? presidData.email_oecfm : '';

        // --- RÉCUPÉRATION ADMINS ---
        const admins = await db.users.findAll({
            attributes: ['email'],
            include: [{
                model: db.roles,
                as: 'role',
                where: { code: { [Op.in]: ['5150', '3355'] } },
                attributes: []
            }],
            raw: true
        });

        const emailsAdmins = admins.map(u => u.email);

        // Construction de la liste CC (Admins + SecGen)
        let ccEmails = [...emailsAdmins];
        if (emailSecretaireGen) ccEmails.push(emailSecretaireGen);
        const destinatairesCC = [...new Set(ccEmails)].join(', ');

        //adresse mail du membre
        const queryMembreEmail = `
            SELECT email_oecfm
            FROM membres_updates
            WHERE membre_id = :mId
        `;

        const [MemberEmailData] = await db.sequelize.query(queryMembreEmail, {
            replacements: { mId: attestation.membre_id },
            type: db.sequelize.QueryTypes.SELECT
        });

        const emailMember = MemberEmailData ? MemberEmailData.email_oecfm : '';
        const emailCCValidationPresident = [...emailsAdmins];
        if (emailSecretaireGen) emailCCValidationPresident.push(emailSecretaireGen);
        if (emailPresident) emailCCValidationPresident.push(emailPresident);
        const destinatairesCCFinalValidation = [...new Set(emailCCValidationPresident)].join(', ');

        // --- CONFIGURATION MAIL ---
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });

        //const appUrl = process.env.APP_URL || "https://www.pgm-oecfm.mg";

        // --- ENVOI SELON LE STEP 3 VALIDATION SECRETAIRE (NON GENERAL) ---
        if (step === 3 && emailSecretaireGen) {
            const genre = sexeSecretaireGen ==='F'? 'Madame': 'Monsieur';
            await transporter.sendMail({
                from: `"Secrétariat OECFM" <${process.env.SMTP_USER}>`,
                to: emailSecretaireGen,
                cc: emailsAdmins,
                subject: `Notification - Attestation en attente de validation SG - ${attestation.num_attestation} - ${attestation.nom}`,
                attachments: [{
                    filename: 'logo500.png',
                    path: path.join(__dirname, '../../public/logo/logo500.png'),
                    cid: 'logo_oecfm'
                }],
                html: `
                    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                        <div style="text-align: center; border-bottom: 2px solid #435844; padding-bottom: 15px;">
                            <img src="cid:logo_oecfm" style="max-height: 50px;" />
                            <h2 style="color: #435844;">Notification Secrétariat</h2>
                        </div>
                        <p>${genre} le Secrétaire Général,</p>
                        <p>Le <strong>Secrétariat</strong> a finalisé sa vérification et validé sa partie pour la demande d'attestation suivante :</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
                            <p style="margin: 5px 0;"><strong>N° Attestation :</strong> ${attestation.num_attestation}</p>
                            <p style="margin: 5px 0;"><strong>Membre :</strong> ${attestation.nom} ${attestation.prenom} (${attestation.matricule})</p>
                            <p style="margin: 5px 0;"><strong>Titre :</strong> ${attestation.titre}</p>
                            <p style="margin: 5px 0;"><strong>Section :</strong> ${attestation.section}</p>
                        </div>
                        
                        <p style="background: #f1f5f9; padding: 10px; border-left: 4px solid #64748b; margin-top: 15px; font-size: 14px; color: #475569;">
                            * Note : Cette demande vous est directement soumise pour validation finale de votre côté.
                        </p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${appUrl}/attestations/validation" style="background: #435844; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Voir l'attestation à valider
                            </a>
                        </div>
                    </div>
                `
            });
        } else if (step === 1 && emailPresident) {
            await transporter.sendMail({
                from: `"Secrétariat OECFM" <${process.env.SMTP_USER}>`,
                to: emailPresident,
                cc: destinatairesCC,
                subject: `Validation Requise - Attestation ${attestation.num_attestation} - ${attestation.nom}`,
                attachments: [{
                    filename: 'logo500.png',
                    path: path.join(__dirname, '../../public/logo/logo500.png'),
                    cid: 'logo_oecfm'
                }],
                html: `
                    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
                            <img src="cid:logo_oecfm" style="max-height: 50px;" />
                            <h2 style="color: #2563eb;">Validation Présidentielle</h2>
                        </div>
                        <p>Monsieur le Président,</p>
                        <p>Le <strong>Secrétaire Général</strong> a validé la demande suivante :</p>
                        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 6px; border: 1px solid #bee3f8;">
                            <p><strong>N° :</strong> ${attestation.num_attestation}</p>
                            <p><strong>Membre :</strong> ${attestation.nom} ${attestation.prenom} (${attestation.matricule})</p>
                            <p><strong>Titre :</strong> ${attestation.titre}</p>
                            <p><strong>Section :</strong> ${attestation.section}</p>
                        </div>
                        <p style="background: #fffbeb; padding: 10px; border-left: 4px solid #f59e0b;">
                            En attente de votre validation finale ou rejet.
                        </p>
                        <div style="text-align: center; margin: 20px;">
                            <a href="${appUrl}/attestations/validation" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Décider de la validation
                            </a>
                        </div>
                    </div>
                `
            });
        } else if (step === 2) {
            if (emailMember) {
                await transporter.sendMail({
                    from: `"Secrétariat OECFM" <${process.env.SMTP_USER}>`,
                    to: emailMember,
                    // On met les admins en CC pour qu'ils sachent que le membre a été notifié
                    cc: destinatairesCCFinalValidation,
                    subject: `Votre attestation ${attestation.num_attestation} est disponible`,
                    attachments: [{
                        filename: 'logo500.png',
                        path: path.join(__dirname, '../../public/logo/logo500.png'),
                        cid: 'logo_oecfm'
                    }],
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                            <div style="text-align: center; border-bottom: 2px solid #497a48; padding-bottom: 15px; margin-bottom: 20px;">
                                <div style="margin-bottom: 10px;">
                                    <img src="cid:logo_oecfm" alt="OECFM" style="max-height: 50px; width: auto;" />
                                </div>
                                <h2 style="color: #497a48; margin: 0;">Attestation Disponible</h2>
                            </div>
                            
                            <p>Cher membre, <strong>${attestation.nom} ${attestation.prenom}</strong>,</p>
                            
                            <p>Nous avons le plaisir de vous informer que votre demande d'attestation a été <strong>validée avec succès</strong> par la Présidence de l'Ordre.</p>
                            
                            <div style="background-color: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0; text-align: center;">
                                <p style="margin: 5px 0; font-size: 1.1rem; color: #166534;"><strong>Référence : ${attestation.num_attestation}</strong></p>
                                <p style="margin: 5px 0; color: #166534;">Exercice : ${attestation.exercice_label}</p>
                            </div>

                            <p>Vous pouvez dès à présent consulter et télécharger votre document original en vous connectant à votre espace personnel sur la plateforme <strong>PGM (Portail de Gestion des Membres)</strong>.</p>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${appUrl}/attestation/demande" style="background-color: #497a48; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                    Télécharger mon attestation
                                </a>
                            </div>

                            <p style="font-size: 0.9rem; color: #64748b;">
                                <em>Note : Ce document est muni d'un code de vérification garantissant son authenticité auprès des institutions.</em>
                            </p>

                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                            
                            <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                                Cordialement,<br/>
                                <strong>Le Secrétariat de l'OECFM</strong>
                            </p>
                        </div>
                    `
                });
            }
        } else if(step === 0 ){
            if (emailMember) {
                await transporter.sendMail({
                    from: `"Secrétariat OECFM" <${process.env.SMTP_USER}>`,
                    to: emailMember,
                    cc: destinatairesCCFinalValidation, // Les admins sont informés du rejet
                    subject: `Information concernant votre demande d'attestation - ${attestation.num_attestation}`,
                    attachments: [{
                        filename: 'logo500.png',
                        path: path.join(__dirname, '../../public/logo/logo500.png'),
                        cid: 'logo_oecfm'
                    }],
                    html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 15px; margin-bottom: 20px;">
                        <div style="margin-bottom: 10px;">
                            <img src="cid:logo_oecfm" alt="OECFM" style="max-height: 50px; width: auto;" />
                        </div>
                        <h2 style="color: #e11d48; margin: 0;">Notification de Rejet</h2>
                    </div>
                    
                    <p>Bonjour <strong>${attestation.nom} ${attestation.prenom}</strong>,</p>
                    
                    <p>Nous vous informons qu'après examen de votre demande d'attestation référencée ci-dessous, celle-ci n'a pas pu être validée par l'administration.</p>
                    
                    <div style="background-color: #fff1f2; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #fecdd3;">
                        <p style="margin: 5px 0;"><strong>Référence :</strong> ${attestation.num_attestation}</p>
                        <p style="margin: 5px 0;"><strong>Exercice :</strong> ${attestation.exercice_label}</p>
                        <p style="margin: 5px 0; color: #e11d48;"><strong>Statut : Demande rejetée</strong></p>
                    </div>

                    <p><strong>Que faire maintenant ?</strong></p>
                    <p>Nous vous invitons à vous connecter à votre espace personnel pour vérifier les éventuels motifs de rejet (pièces manquantes, informations erronées ou situation non régularisée) et soumettre une nouvelle demande corrigée.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${appUrl}/attestation/demande" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Consulter ma demande
                        </a>
                    </div>

                    <p style="font-size: 0.9rem; color: #64748b;">
                        Si vous estimez qu'il s'agit d'une erreur, vous pouvez contacter le secrétariat de l'Ordre en répondant à ce mail.
                    </p>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    
                    <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                        Cordialement,<br/>
                        <strong>L'équipe administrative de l'OECFM</strong>
                    </p>
                </div>
                `
                });
            }
        }

        res.status(200).json({
            message: `Étape ${step} validée.`,
            data: attestation
        });

    } catch (err) {
        console.error(err); // Toujours loguer l'erreur réelle en console pour débugger
        res.status(500).json({ message: "Erreur interne lors de la validation." });
    }
};