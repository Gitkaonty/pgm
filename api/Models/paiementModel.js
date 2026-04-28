module.exports = (sequelize, Sequelize) => {
    const Paiement = sequelize.define("paiements", {
        id: { 
            type: Sequelize.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        membre_id: { 
            type: Sequelize.INTEGER, 
            allowNull: false 
        },
        exercice_id: { 
            type: Sequelize.INTEGER, 
            allowNull: false 
        },
        date_paiement: { 
            type: Sequelize.DATEONLY, 
            defaultValue: Sequelize.NOW 
        },
        anouveau: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        cotis_annee: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        autre_appel: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        total: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        mode_reglement: { 
            type: Sequelize.STRING 
        },
        reference: { 
            type: Sequelize.TEXT 
        },
        valide: { 
            type: Sequelize.BOOLEAN, 
            defaultValue: true 
        },
         num_auto: { 
            type: Sequelize.BIGINT, 
            allowNull: false 
        },
        num_ticket: { 
            type: Sequelize.STRING, 
            allowNull: false 
        },
    }, {
        timestamps: true, // Pour garder trace de quand le paiement a été saisi
        freezeTableName: true,
        underscored: true,
    });

    return Paiement;
};