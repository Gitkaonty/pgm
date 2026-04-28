module.exports = (sequelize, Sequelize) => {
    const AjustementAppel = sequelize.define("ajustementappels", {
        id: { 
            type: Sequelize.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        exercice_id: { 
            type: Sequelize.INTEGER, 
            allowNull: false 
        },
        membre_id: { 
            type: Sequelize.INTEGER, 
            allowNull: false 
        },
        // Le montant de l'ajustement (ex: -50000 pour une remise, 20000 pour une amende)
        montant_ajustement: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        // Pour expliquer l'ajustement dans le tableau
        motif: { 
            type: Sequelize.STRING(255),
            allowNull: false 
        },
        type_ajustement: { 
            type: Sequelize.ENUM('Remise', 'Majoration', 'Correction'),
            defaultValue: 'Correction'
        },
        date_ajustement: { 
            type: Sequelize.DATE, 
            defaultValue: Sequelize.NOW 
        },
        // On garde les infos de situation pour l'historique au moment de l'ajustement
        section: { type: Sequelize.STRING },
        statut: { type: Sequelize.STRING },
        titre: { type: Sequelize.STRING },
        
        etat: { 
            type: Sequelize.STRING, 
            defaultValue: 'En attente' 
        },
        valide: { 
            type: Sequelize.BOOLEAN, 
            defaultValue: false 
        }
    }, {
        timestamps: true, // Utile pour savoir quand l'ajustement a été créé
        freezeTableName: true,
        underscored: true,
    });

    return AjustementAppel;
};