module.exports = (sequelize, Sequelize) => {
    const Appel = sequelize.define("appels", {
        id: { type: Sequelize.INTEGER, primary_key: true, autoIncrement: true, primaryKey: true },
        exercice_id: { type: Sequelize.INTEGER, allowNull: false },
        membre_id: { type: Sequelize.INTEGER, allowNull: false },
        montant_du: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        regime: { type: Sequelize.STRING },
        date_appel: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        etat: { type: Sequelize.STRING, defaultValue: 'En attente' },
        section: {type: Sequelize.ENUM('Expert Comptable', 'Société Expert')},
        statut: {type: Sequelize.ENUM('Expert Comptable', 'Expert Stagiaire')},
        titre: {type: Sequelize.ENUM('Tableau A', 'Tableau B')},
        associe: { type: Sequelize.INTEGER },
        valide: { type: Sequelize.BOOLEAN, defaultValue: false },
        total_ajustement: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        total_autre_appel: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        appelnet: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        num_auto: { 
            type: Sequelize.BIGINT, 
            allowNull: false 
        },
        num_note: { 
            type: Sequelize.STRING, 
            allowNull: false 
        },
    }, {
        timestamps: false,
        freezeTableName: true,
        underscored: true,
    });
    return Appel;
};

