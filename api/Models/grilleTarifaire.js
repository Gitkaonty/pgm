module.exports = (sequelize, DataTypes) => {
    const GrilleTarifaire = sequelize.define('grille_tarifaires', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        exercice_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'exercices', key: 'id' }
        },
        section: {
            type: DataTypes.ENUM('Expert Comptable', 'Société Experts'),
            allowNull: false
        },
        statut: {
            type: DataTypes.ENUM('Expert Comptable', 'Expert Stagiaire'),
            defaultValue: 'N/A'
        },
        titre: {
            type: DataTypes.ENUM('Tableau A', 'Tableau B', 'N/A'),
            defaultValue: 'N/A'
        },
        regime: {
            type: DataTypes.INTEGER, // 0: Normal (Plein pot), 1: Réduit (Adhésion en cours d'année)
            defaultValue: 0
        },
        nbr_associes_min: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        nbr_associes_max: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        montant: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        }
    }, {
        tableName: 'grille_tarifaires',
        timestamps: true,
        underscored: true
    });

    return GrilleTarifaire;
};