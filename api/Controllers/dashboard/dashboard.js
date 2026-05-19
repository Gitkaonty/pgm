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

exports.getDashboardStatsOLD = async (req, res) => {
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
            
            promotions: promosResult? promosResult.map(p => ({
                promotion: p.promotion,
                count: p.count
            })) : [],
            attestationsAPrevoir: pendingAttestationsCount || 0,
            soldePersonnel: situation
        });

    } catch (error) {
        console.error("Erreur Sequelize Dashboard:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
    }
};

exports.getDashboardStats = async (req, res) => {
    const { exerciceId } = req.params;
    const ConnectedUserRoles = req.roles;
    const ConnectedUser = req.user;
    let ConnectedMember_Id = 0;
    let admin = false;

    if ([3355, 5150].includes(ConnectedUserRoles)) {
        admin = true;
    }

    const AttachedMember_ConnectedUser = await user.findByPk(ConnectedUser.userId, {
        attributes: ['membre_id'],
        raw: true
    });

    if (AttachedMember_ConnectedUser) {
        ConnectedMember_Id = AttachedMember_ConnectedUser.membre_id;
    }

    try {
        const exerciceInfos = await db.exercices.findByPk(exerciceId);
        
        if (!exerciceInfos) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        const dateFin = exerciceInfos.date_fin;

        // On regroupe les requêtes lourdes dans le Promise.all existant
        const [countsResult, promosResult, dataSexResult, ageDistResult, tarifsResult] = await Promise.all([
            // 1. Tes compteurs globaux existants
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
                    SUM(CASE WHEN titre = 'Tableau A' THEN 1 ELSE 0 END)::int as cata,
                    SUM(CASE WHEN titre = 'Tableau B' THEN 1 ELSE 0 END)::int as catb
                FROM SituationAuPoint
            `, {
                replacements: { dateFin: dateFin },
                type: QueryTypes.SELECT
            }),

            // 2. Évolution par promotions existante
            db.sequelize.query(`
                SELECT promotion, COUNT(*)::int as count 
                FROM membresidentites 
                WHERE promotion IS NOT NULL
                GROUP BY promotion 
                ORDER BY promotion ASC
            `, {
                type: QueryTypes.SELECT
            }),

            // 3. NOUVEAU : Répartition Sexe par Type (Tableau A, B, Stagiaire)
            // db.sequelize.query(`
            //     WITH SituationAuPoint AS (
            //         SELECT 
            //             -- On récupère le sexe de l'identité
            //             (m.sexe) as sexe, 
            //             -- On détermine le type de profil pour les graphes
            //             CASE 
            //                 WHEN u.titre = 'Stagiaire' THEN 'Stagiaire'
            //                 WHEN u.titre = 'Tableau A' THEN 'Tableau A'
            //                 WHEN u.titre = 'Tableau B' THEN 'Tableau B'
            //                 ELSE 'Autre'
            //             END as type_graphe
            //         FROM membresidentites m
            //         LEFT JOIN membres_updates u ON u.id = (
            //             SELECT id FROM membres_updates 
            //             WHERE membre_id = m.id 
            //             AND date_modification <= :dateFin 
            //             ORDER BY date_modification DESC, id DESC LIMIT 1
            //         )
            //         WHERE u.membre_active = 'Oui'
            //     )
            //     SELECT 
            //         type_graphe as type,
            //         SUM(CASE WHEN sexe IN ('homme', 'M', 'masculin') THEN 1 ELSE 0 END)::int as homme,
            //         SUM(CASE WHEN sexe IN ('femme', 'F', 'féminin', 'feminin') THEN 1 ELSE 0 END)::int as femme
            //     FROM SituationAuPoint
            //     WHERE type_graphe != 'Autre'
            //     GROUP BY type_graphe
            //     ORDER BY type_graphe ASC;
            // `, {
            //     replacements: { dateFin: dateFin },
            //     type: QueryTypes.SELECT
            // }),

            db.sequelize.query(`
                WITH SituationAuPoint AS (
                    SELECT 
                        (m.sexe) as sexe, 
                        CASE 
                            WHEN u.titre = 'Stagiaire' THEN 'Stagiaire'
                            WHEN u.titre = 'Tableau A' THEN 'Tableau A'
                            WHEN u.titre = 'Tableau B' THEN 'Tableau B'
                            ELSE 'Autre'
                        END as type_graphe
                    FROM membresidentites m
                    LEFT JOIN membres_updates u ON u.id = (
                        SELECT id FROM membres_updates 
                        WHERE membre_id = m.id 
                        AND date_modification <= :dateFin 
                        ORDER BY date_modification DESC, id DESC LIMIT 1
                    )
                    WHERE u.membre_active = 'Oui' AND u.section != 'Société Expert'
                ),
                DetailsGroupes AS (
                    SELECT 
                        type_graphe as type,
                        SUM(CASE WHEN sexe IN ('homme', 'M', 'masculin') THEN 1 ELSE 0 END)::int as homme,
                        SUM(CASE WHEN sexe IN ('femme', 'F', 'féminin', 'feminin') THEN 1 ELSE 0 END)::int as femme
                    FROM SituationAuPoint
                    WHERE type_graphe != 'Autre'
                    GROUP BY type_graphe
                )
                
                -- On récupère d'abord les lignes normales triées par type
                SELECT type, homme, femme FROM DetailsGroupes
                
                UNION ALL
                
                -- On ajoute la ligne du Total général tout à la fin
                SELECT 
                    'Total' as type,
                    SUM(homme)::int as homme,
                    SUM(femme)::int as femme
                FROM DetailsGroupes;
            `, {
                replacements: { dateFin: dateFin },
                type: QueryTypes.SELECT
            }), 

            // 4. NOUVEAU : Répartition par Tranche d'Âge et Type
            db.sequelize.query(`
                WITH SituationAuPoint AS (
                    SELECT 
                        EXTRACT(YEAR FROM AGE(:dateFin, m.date_naissance))::int as age,
                        CASE 
                            WHEN u.section = 'Expert Comptable' AND u.statut = 'Expert Stagiaire' THEN 'Stagiaire'
                            WHEN u.titre = 'Tableau A' THEN 'Tableau A'
                            WHEN u.titre = 'Tableau B' THEN 'Tableau B'
                            ELSE 'Autre'
                        END as type_graphe
                    FROM membresidentites m
                    LEFT JOIN membres_updates u ON u.id = (
                        SELECT id FROM membres_updates 
                        WHERE membre_id = m.id 
                        AND date_modification <= :dateFin 
                        ORDER BY date_modification DESC, id DESC LIMIT 1
                    )
                    WHERE u.membre_active = 'Oui' AND m.date_naissance IS NOT NULL
                ),
                TranchesCalculees AS (
                    SELECT 
                        type_graphe,
                        CASE 
                            WHEN age BETWEEN 20 AND 29 THEN '20-30'
                            WHEN age BETWEEN 30 AND 39 THEN '30-40'
                            WHEN age BETWEEN 40 AND 49 THEN '40-50'
                            WHEN age BETWEEN 50 AND 59 THEN '50-60'
                            ELSE '60+' 
                        END AS tranche
                    FROM SituationAuPoint
                    WHERE type_graphe != 'Autre'
                )
                SELECT 
                    tranche,
                    SUM(CASE WHEN type_graphe = 'Tableau A' THEN 1 ELSE 0 END)::int as "Tableau A",
                    SUM(CASE WHEN type_graphe = 'Tableau B' THEN 1 ELSE 0 END)::int as "Tableau B",
                    SUM(CASE WHEN type_graphe = 'Stagiaire' THEN 1 ELSE 0 END)::int as "Stagiaire"
                FROM TranchesCalculees
                GROUP BY tranche
                ORDER BY tranche ASC;
            `, {
                replacements: { dateFin: dateFin },
                type: QueryTypes.SELECT
            }),

            // 4. GRILLE TARIFAIRE
            db.sequelize.query(`
                WITH SrcGrille AS (
                    SELECT 
                        regime,
                        montant,
                        CASE 
                            WHEN section = 'Société Expert' AND nbr_associes_min = 0 AND nbr_associes_max = 2 THEN 'Société [0<Associés <2]'
                            WHEN section = 'Société Expert' AND nbr_associes_min = 3 AND nbr_associes_max = 5 THEN 'Société [3<Associés <5]'
                            WHEN section = 'Société Expert' AND nbr_associes_min = 6 AND nbr_associes_max = 1000 THEN 'Société [6<Associés]'
                            WHEN titre = 'Stagiaire' THEN 'Stagiaire'
                            WHEN titre = 'Tableau A' THEN 'Tableau A'
                            WHEN titre = 'Tableau B' THEN 'Tableau B'
                            ELSE 'Autre'
                        END as row_type
                    FROM grille_tarifaires
                    WHERE exercice_id = :exerciceId
                )
                SELECT 
                    row_type as type,
                    -- Correspondance mise à jour : 1 = Réduit, 0 = Normal
                    SUM(CASE WHEN regime = 1 THEN montant ELSE 0 END)::numeric as reduit,
                    SUM(CASE WHEN regime = 0 THEN montant ELSE 0 END)::numeric as normal
                FROM SrcGrille
                WHERE row_type != 'Autre'
                GROUP BY row_type
                ORDER BY 
                    CASE 
                        WHEN row_type = 'Stagiaire' THEN 1
                        WHEN row_type = 'Tableau A' THEN 2
                        WHEN row_type = 'Tableau B' THEN 3
                        WHEN row_type LIKE '%0<Associé%' THEN 4
                        WHEN row_type LIKE '%3<Associé%' THEN 5
                        ELSE 6 
                    END ASC;
            `, {
                replacements: { exerciceId: exerciceId },
                type: QueryTypes.SELECT
            })
        ]);

        const stats = countsResult[0]; 

        // Reste de tes calculs financiers inchangés
        const anouveauResult = await appel.findAll({
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('appelnet')), 'totalAppel']],
            include: [{
                model: exercice,
                as: 'exercice',
                where: { date_fin: { [Op.lte]: dateFin } },
                attributes: []
            }],
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
                where: { date_fin: { [Op.lte]: dateFin } },
                attributes: []
            }],
            where: { 
                valide: true,
                ...(!admin && { membre_id: ConnectedMember_Id })
            },
            raw: true
        });

        const situation = parseFloat(anouveauResult[0]?.totalAppel || 0) - parseFloat(anouveauResultPaiement[0]?.totalPaiement || 0);

        const pendingAttestationsCount = await attestation.count({
            where: {
                validation_2: { [Op.or]: [false, null] }
            }
        });

        // Envoi final des données structurées pour le Front
        res.status(200).json({
            totalMembres: stats.total || 0,
            expertsCount: stats.experts || 0,
            stagiairesCount: stats.stagiaires || 0,
            societesCount: stats.societes || 0,
            catA: stats.cata || 0,
            catb: stats.catb || 0,
            
            // Les deux nouveaux jeux de données mappés pour Recharts
            dataSex: dataSexResult || [],
            ageDistribution: ageDistResult || [],

            promotions: promosResult ? promosResult.map(p => ({
                promotion: p.promotion,
                count: p.count
            })) : [],
            attestationsAPrevoir: pendingAttestationsCount || 0,
            soldePersonnel: situation,
            grilleTarifs: tarifsResult || []
        });

    } catch (error) {
        console.error("Erreur Sequelize Dashboard:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
    }
};