const { Op } = require('sequelize');
const db = require('../../models');
const user = db.users;

exports.getGrandLivre = async (req, res) => {
    try {
        const { exerciceId, membreId } = req.query;

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

        // Identification dynamique des modèles (évite les erreurs undefined)
        const Exercice = db.exercices;
        const Membre = db.membres;
        const Appel = db.appels;
        const Paiement = db.paiements;

        const exercice = await Exercice.findByPk(exerciceId);
        if (!exercice) return res.status(404).json({ message: "Exercice non trouvé" });

        const dateDebut = exercice.date_debut;

        // Filtre : Si membreId est fourni, on filtre. Sinon, {} récupère tout.
        //const membreFilter = membreId ? { id: membreId } : {};

        const membreFilter = (membreId && membreId !== 'null' && membreId !== 'all')
            ? { id: membreId }
            : {};

        const membres = await Membre.findAll({
            where: membreFilter,
            attributes: ['id', 'matricule', 'nom', 'prenom'],
            order: [['nom', 'ASC']]
        });

        // const membres = await Membre.findAll({
        //     where: {
        //         ...membreFilter,
        //         // Si l'utilisateur n'est pas admin, on ÉCRASE l'id de membreFilter
        //         // par son propre ConnectedMember_Id pour garantir la sécurité.
        //         ...(!admin && { id: ConnectedMember_Id })
        //     },
        //     attributes: ['id', 'matricule', 'nom', 'prenom'],
        //     order: [['nom', 'ASC']]
        // });

        // 2. On filtre manuellement si l'utilisateur n'est pas admin
        if (!admin) {
            membres = membres.filter(m => m.id === ConnectedMember_Id);
        }

        const balanceFinale = await Promise.all(membres.map(async (m) => {
            // Calcul A Nouveau (Antérieur à l'exercice)
            const anAppels = await (db.appels).sum('appelnet', {
                where: {
                    membre_id: m.id,
                    valide: true
                },
                include: [{
                    model: db.exercices,
                    as: 'exercice',
                    attributes: [], // CRITIQUE : Empêche Postgres de vouloir grouper par exercice.id
                    where: {
                        date_fin: { [Op.lt]: dateDebut }
                    }
                }],
                // On force Sequelize à ne pas ajouter de colonnes inutiles
                raw: true
            }) || 0;

            const anPaies = await (db.paiements).sum('total', {
                where: {
                    membre_id: m.id,
                    valide: true
                },
                include: [{
                    model: db.exercices,
                    as: 'exercice',
                    attributes: [], // Indispensable ici aussi
                    where: {
                        date_fin: { [Op.lt]: dateDebut }
                    }
                }],
                raw: true
            }) || 0;

            const reportAN = parseFloat(anAppels) - parseFloat(anPaies);

            // 2. MOUVEMENTS DE L'EXERCICE SÉLECTIONNÉ (Direct via ID)
            const exAppels = await db.appels.sum('appelnet', {
                where: {
                    membre_id: m.id,
                    exercice_id: exerciceId, // On filtre directement par l'ID choisi
                    valide: true
                }
            }) || 0;

            const exPaies = await db.paiements.sum('total', {
                where: {
                    membre_id: m.id,
                    exercice_id: exerciceId, // On filtre directement par l'ID choisi
                    valide: true
                }
            }) || 0;

            // CALCUL FINAL POUR LA BALANCE
            const totalDebit = parseFloat(exAppels);
            const totalCredit = parseFloat(exPaies);

            // Mouvements de l'exercice (via View SQL)
            const mouvements = await db.sequelize.query(
                `SELECT * FROM view_grand_livre WHERE exercice_id = :exId AND membre_id = :mId ORDER BY date_op ASC`,
                {
                    replacements: { exId: exerciceId, mId: m.id },
                    type: db.Sequelize.QueryTypes.SELECT
                }
            );

            //const totalDebit = parseFloat(anAppels) + mouvements.reduce((sum, mov) => sum + parseFloat(mov.debit || 0), 0);
            //const totalCredit = parseFloat(anPaies) + mouvements.reduce((sum, mov) => sum + parseFloat(mov.credit || 0), 0);

            return {
                membreId: m.id,
                matricule: m.matricule,
                nom: m.nom,
                prenom: m.prenom,
                soldeInitial: reportAN,
                totalDebit,
                totalCredit,
                solde: reportAN + totalDebit - totalCredit,
                details: mouvements
            };
        }));

        // Retourne uniquement ceux qui ont de l'activité
        //res.json(balanceFinale.filter(b => b.totalDebit !== 0 || b.totalCredit !== 0));
        res.json(balanceFinale);

    } catch (error) {
        console.error("BACKEND ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};