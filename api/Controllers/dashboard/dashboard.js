const db = require("../../Models");
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const membre = db.membres;
const paiement = db.paiements;
const exercice = db.exercices;
const emaillog =db.emaillogs;
const appel = db.appels;
const emaillogappel =db.emaillogsappels;
const attestation = db.attestations;
const user = db.users;

exports.getDashboardStats = async (req, res) => {
    const { exerciceId } = req.params;
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

    try {
        const exerciceInfos = await db.exercices.findByPk(exerciceId);
        
        if (!exerciceInfos) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        const dateFin = exerciceInfos.date_fin;

        const [countsResult, promosResult] = await Promise.all([
            db.sequelize.query(`
                WITH SituationAuPoint AS (
                    SELECT 
                        m.id, u.section, u.statut, u.titre, u.membre_active
                    FROM membresidentites m
                    LEFT JOIN membres_updates u ON u.id = (
                        SELECT id FROM membres_updates 
                        WHERE membre_id = m.id 
                        AND date_modification <= :dateFin 
                        ORDER BY date_modification DESC, id DESC LIMIT 1
                    )
                    WHERE u.membre_active = 'Oui'
                )
                SELECT 
                    COUNT(*)::int as total,
                    SUM(CASE WHEN section = 'Expert Comptable' AND statut = 'Expert Comptable' THEN 1 ELSE 0 END)::int as experts,
                    SUM(CASE WHEN section = 'Expert Comptable' AND statut = 'Expert Stagiaire' THEN 1 ELSE 0 END)::int as stagiaires,
                    SUM(CASE WHEN section = 'Société Expert' THEN 1 ELSE 0 END)::int as societes,
                    
                    -- Ajout des compteurs Catégorie A et B selon la colonne statut
                    SUM(CASE WHEN titre = 'Tableau A' THEN 1 ELSE 0 END)::int as cata,
                    SUM(CASE WHEN titre = 'Tableau B' THEN 1 ELSE 0 END)::int as catb
                FROM SituationAuPoint
            `, {
                replacements: { dateFin: dateFin },
                type: QueryTypes.SELECT
            }),

            db.sequelize.query(`
                SELECT promotion, COUNT(*)::int as count 
                FROM membresidentites 
                WHERE promotion IS NOT NULL
                GROUP BY promotion 
                ORDER BY promotion ASC
            `, {
                replacements: { dateFin: dateFin },
                type: QueryTypes.SELECT
            })
        ]);

        const stats = countsResult[0]; 

        const anouveauResult = await appel.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('appelnet')), 'totalAppel']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lte]: dateFin }
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            //where: { membre_id: membreId, valide: true },
            where: { 
                valide: true,
                ...(!admin && { membre_id: ConnectedMember_Id })
            },
            raw: true
        });

        const anouveauResultPaiement = await paiement.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalPaiement']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: {
                    date_fin: { [Op.lte]: dateFin }
                },
                attributes: [] // On ne veut pas les colonnes de l'exercice, juste le filtre
            }],
            //where: { membre_id: membreId, valide: true },
            where: { 
                valide: true,
                ...(!admin && { membre_id: ConnectedMember_Id })
            },
            raw: true
        });

        const situation = parseFloat(anouveauResult[0]?.totalAppel || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0)

        // Compte le nombre d'attestations où validation_2 est false (ou null selon ta DB)
        const pendingAttestationsCount = await attestation.count({
            where: {
                validation_2: { [Op.or]: [false, null] }
            }
        });
        
        res.status(200).json({
            totalMembres: stats.total || 0,
            expertsCount: stats.experts || 0,
            stagiairesCount: stats.stagiaires || 0,
            societesCount: stats.societes || 0,
            
            // On renvoie les nouvelles stats pour le PieChart
            catA: stats.cata || 0,
            catB: stats.catb || 0,
            
            promotions: promosResult.map(p => ({
                promotion: p.promotion,
                count: p.count
            })),
            attestationsAPrevoir: pendingAttestationsCount || 0,
            soldePersonnel: situation
        });

    } catch (error) {
        console.error("Erreur Sequelize Dashboard:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
    }
};