module.exports = (sequelize, DataTypes) => {
    const Exercice = sequelize.define('exercices', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        libelle: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Nom de l'exercice fiscal (ex: Exercice 2026)"
        },
        date_debut: {
            type: DataTypes.DATEONLY, // DATEONLY car on n'a pas besoin de l'heure
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        cloture: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: "Définit si l'exercice est verrouillé"
        }
    }, {
        tableName: 'exercices',
        timestamps: true, // Génère automatiquement created_at et updated_at
        underscored: true, // Pour avoir created_at au lieu de createdAt
        
        // Optionnel : Ajout d'une validation pour empêcher date_fin < date_debut
        validate: {
            datesCoherentes() {
                if (new Date(this.date_fin) <= new Date(this.date_debut)) {
                    throw new Error("La date de fin doit être supérieure à la date de début.");
                }
            }
        }
    });

    return Exercice;
};