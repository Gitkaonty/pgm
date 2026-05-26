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
const user = db.users;
const appUrl = process.env.APP_URL || "https://www.pgm.oecfm.mg";

const TicketCaisseTemplate = require('../../Utils/ticketCaisseTemplate');
const { renderToStream } = require('@react-pdf/renderer');
const React = require('react');
const { renderToBuffer } = require('@react-pdf/renderer');

// Charger la liste pour le DataGrid
exports.findAllPaiements = async (req, res) => {
    const ex_id = req.query.exerciceId;

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

        const data = await paiement.findAll({
            where: { 
                exercice_id: ex_id, 
                ...(!admin && { membre_id: ConnectedMember_Id })
            },
            include: [
                {
                    model: membre,
                    as: 'membre',
                    attributes: ['matricule', 'nom', 'prenom']
                },
                {
                    model: emaillog, // Référence à ta nouvelle table
                    as: 'email_logs',
                    attributes: ['id'] // On ne prend que l'ID pour optimiser la requête
                }
            ],
            order: [['date_paiement', 'DESC']]
        });

        const rows = data.map(p => ({
            id: p.id,
            matricule: p.membre?.matricule,
            nom: p.membre?.nom,
            prenom: p.membre?.prenom,
            anouveau: parseFloat(p.anouveau),
            cotis_annee: parseFloat(p.cotis_annee), // Utilise le nom exact de ta base
            autre_appel: parseFloat(p.autre_appel),
            total: parseFloat(p.total),
            date: p.date_paiement,
            mode: p.mode_reglement,
            reference: p.reference,
            num_ticket: p.num_ticket,
            created_at: p.createdAt || p.created_at,
            valide: p.valide,
            // On récupère la longueur du tableau des logs pour le badge du Front
            nb_envois: p.email_logs ? p.email_logs.length : 0
        }));

        res.send(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Enregistrer un nouveau paiement
exports.createPaiement = async (req, res) => {
    try {
        const {
            membreId,
            exerciceId,
            date,
            payeAnouveau,
            payeCotisation,
            payeAutre,
            mode,
            reference
        } = req.body;

        // 1. Correction du nom (Utilise le Modèle avec Majuscule : Exercice)
        // On stocke le résultat dans 'exerciceData' pour éviter tout conflit
        const exerciceData = await exercice.findByPk(exerciceId);

        if (!exerciceData) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        const yearStart = new Date(exerciceData.date_debut).getFullYear().toString().slice(-2);
        const yearEnd = new Date(exerciceData.date_fin).getFullYear().toString().slice(-2);
        const prefix = `OECFM/RV/${yearStart}_${yearEnd}-`;

        // 2. Utilise le Modèle Paiement (Majuscule)
        const lastPaiement = await paiement.findOne({
            where: { exercice_id: exerciceId }, // Vérifie si c'est exercice_id ou exerciceId en DB
            order: [['num_auto', 'DESC']]
        });

        // 3. Calcul sécurisé du nouveau numéro
        const nextSeq = lastPaiement ? (parseInt(lastPaiement.num_auto) + 1) : 1;

        // 4. FORMATAGE FINAL
        const formattedSeq = nextSeq.toString().padStart(6, '0');
        const referenceFinale = `${prefix}${formattedSeq}`;

        const total = parseFloat(payeAnouveau || 0) + parseFloat(payeCotisation || 0) + parseFloat(payeAutre || 0);

        // 5. Création avec les bonnes variables
        const nouveauPaiement = await paiement.create({
            membre_id: membreId,
            exercice_id: exerciceId,
            date_paiement: date,
            anouveau: payeAnouveau || 0,
            cotis_annee: payeCotisation || 0,
            autre_appel: payeAutre || 0,
            total: parseFloat(payeAnouveau || 0) + parseFloat(payeCotisation || 0) + parseFloat(payeAutre || 0),
            mode_reglement: mode,
            reference:reference,
            num_auto: nextSeq, // On utilise la variable calculée plus haut
            num_ticket: referenceFinale,
            valide: false
        });

        res.status(201).send(nouveauPaiement);
    } catch (err) {
        console.error("Détail erreur:", err); // Toujours loguer l'erreur complète sur le serveur
        res.status(500).send({
            message: err.message || "Erreur lors de la création du paiement."
        });
    }
};

// Validation d'un paiement
exports.validate = async (req, res) => {
    try {
        await paiement.update({ valide: true }, { where: { id: req.params.id } });
        res.send({ message: "Paiement validé avec succès." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Suppression d'un paiement
exports.delete = async (req, res) => {
    try {
        await paiement.destroy({ where: { id: req.params.id } });
        res.send({ message: "Paiement supprimé." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.unvalidate = async (req, res) => {
    try {
        const id = req.params.id;
        await paiement.update({ valide: false }, { where: { id: id } });
        res.send({ message: "Paiement dévalidé." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

const performEmailSending = async (paiementId, dateFin) => {
    // 1. Récupération des données (ton code existant)
    const p = await paiement.findByPk(paiementId, {
        include: [{ model: membre, as: 'membre', attributes: ['nom', 'prenom'] }]
    });
    if (p.valide) {
        const [mInfo] = await db.sequelize.query(`
            SELECT u.email_oecfm FROM membres_updates u 
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

        // 4. Générer le PDF
        const allExercices = await db.exercices.findAll();
        const pdfStream = await renderToStream(
            React.createElement(TicketCaisseTemplate, {
                row: p,
                exercice: allExercices,
            })
        );

        //const appUrl = "https://www.pgm-oecfm.mg";

        // 3. Envoi
        await transporter.sendMail({
            from: `"Comptabilité OECFM" <${process.env.SMTP_USER}>`,
            to: emailDestinataire,
            subject: `Confirmation de paiement - Ticket N° ${p.num_ticket}`,
            attachments: [
                {
                    filename: `Recu_${p.num_ticket}.pdf`,
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
                
                <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
                    <div style="margin-bottom: 10px;">
                        <img 
                            src="cid:logo_oecfm" 
                            alt="OECFM" 
                            style="height: 35px; width: 35px; display: inline-block; vertical-align: middle;" 
                        />
                    </div>
                    <h2 style="color: #10b981; margin: 0;">Paiement Confirmé</h2>
                    <p style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">Ticket N° ${p.num_ticket}</p>
                </div>
                
                <p>Bonjour <strong>${p.membre.prenom} ${p.membre.nom}</strong>,</p>
                
                <p>Nous vous confirmons avoir bien reçu votre règlement. Votre compte a été mis à jour avec succès. Vous trouverez votre reçu de paiement en pièce jointe.</p>
                
                <div style="background-color: #ecfdf5; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #065f46;">Date du paiement :</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #065f46;">
                                ${new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #065f46;">Mode de règlement :</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #065f46;">${p.mode_reglement}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0 5px 0; color: #065f46; font-size: 1.1rem;">Montant encaissé :</td>
                            <td style="padding: 15px 0 5px 0; text-align: right; font-weight: 800; color: #059669; font-size: 1.3rem;">
                                ${(parseFloat(p.anouveau) + parseFloat(p.cotis_annee) + parseFloat(p.autre_appel)).toLocaleString('fr-FR')} Ar
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 0.9rem; color: #64748b; text-align: center;">
                    Merci de votre confiance. Votre situation financière est consultable en temps réel sur votre tableau de bord.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl || '#'}" style="background-color: #4b967d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        Voir mon solde sur le portail de gestion des membres (PGM)
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                
                <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                    <strong>Ordre des Experts Comptables et Financiers de Madagascar</strong><br/>
                    Ceci est une confirmation automatique de paiement.
                </p>
            </div>
            `
        });

        // 4. Log succès
        return await emaillog.create({
            paiement_id: p.id,
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

        res.status(500).send({ message: "Erreur lors de l'envoi de l'email." });
    }
};

exports.sendBulkEmails = async (req, res) => {
    const { paiementIds, dateFin } = req.body;

    // Sécurité : vérifier si la liste n'est pas vide
    if (!paiementIds || !Array.isArray(paiementIds) || paiementIds.length === 0) {
        return res.status(400).send({ message: "Aucun paiement sélectionné." });
    }

    try {
        let successCount = 0;
        let errorCount = 0;

        // On boucle sur les IDs envoyés par le tableau React
        for (const id of paiementIds) {
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
        const { paiementId } = req.params;

        // On cherche tous les logs liés à cet ID, triés du plus récent au plus ancien
        const logs = await emaillog.findAll({
            where: { paiement_id: paiementId },
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

exports.getSyntheseReglement = async (req, res) => {
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
        const cotisAnnee = await appel.sum('montant_du', {
            where: {
                membre_id: membreId,
                exercice_id: exerciceId,
                valide: true
            }
        }) || 0;

        const autreAppel = await appel.sum('total_ajustement', {
            where: {
                membre_id: membreId,
                exercice_id: exerciceId,
                valide: true
            }
        }) || 0;

        // 3. Réponse formatée pour le Front
        res.json({
            anouveau: parseFloat(anouveauResult[0]?.totalAnouveau || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0),
            cotisAnnee: parseFloat(cotisAnnee || 0),
            autreAppel: parseFloat(autreAppel || 0)
        });

    } catch (error) {
        console.error("Erreur synthèse règlement:", error);
        res.status(500).send({ message: "Erreur lors du calcul des soldes." });
    }
};