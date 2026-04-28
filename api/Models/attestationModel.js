module.exports = (sequelize, Sequelize) => {
    const Attestation = sequelize.define("attestations", {
        id: { 
            type: Sequelize.BIGINT, 
            primaryKey: true, 
            autoIncrement: true 
        },
        // Relations
        exercice_id: { 
            type: Sequelize.BIGINT, 
            allowNull: false 
        },
        membre_id: { 
            type: Sequelize.BIGINT, 
            allowNull: false 
        },
        // Informations au moment de l'édition
        date_edition: { 
            type: Sequelize.DATEONLY, 
            allowNull: false,
            defaultValue: Sequelize.NOW 
        },
        matricule: { type: Sequelize.STRING },
        nom: { type: Sequelize.STRING },
        prenom: { type: Sequelize.STRING },
        sexe: { type: Sequelize.STRING },
        adresse: { type: Sequelize.STRING },
        section: { type: Sequelize.STRING }, // Expert Comptable ou Société d'expert
        titre: { type: Sequelize.STRING },   // Tableau A ou Tableau B
        statut: { type: Sequelize.STRING },  // Expert Comptable ou Stagiaire
        poste: { type: Sequelize.STRING },
        date_adhesion: { type: Sequelize.DATEONLY },
        exercice_label: { type: Sequelize.STRING }, // Pour stocker le format "2020-2021" en clair
        
        // Finances et Validation
        solde: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        validation_1: { 
            type: Sequelize.BOOLEAN, 
            defaultValue: false 
        },
        validation_2: { 
            type: Sequelize.BOOLEAN, 
            defaultValue: false 
        },
        rejeter: { 
            type: Sequelize.BOOLEAN, 
            defaultValue: false 
        },
         num_auto: { 
            type: Sequelize.BIGINT, 
            allowNull: false 
        },
        num_attestation: { type: Sequelize.STRING },
        annee: { type: Sequelize.STRING },
    }, {
        underscored: true, // Pour avoir date_edition et exercice_id dans Postgres
        timestamps: true
    });

    return Attestation;
};