module.exports = (sequelize, Sequelize) => {
    const AutreAppel = sequelize.define("autres_appels", {
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
        // Le montant de l'autre appel (s'ajoute à l'appel net du membre)
        montant_autre: {
            type: Sequelize.DECIMAL(15, 2),
            defaultValue: 0
        },
        // Libellé explicatif de l'autre appel
        motif: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        type_autre: {
            type: Sequelize.STRING,
            defaultValue: 'AUTRE_APPEL'
        },
        date_autre: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        // Infos de situation au moment de l'autre appel (historique)
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
        timestamps: true,
        freezeTableName: true,
        underscored: true,
    });

    return AutreAppel;
};
