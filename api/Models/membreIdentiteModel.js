module.exports = (sequelize, DataTypes) => {
    const MembreIdentite = sequelize.define("membresidentite", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        matricule: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        nom: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        prenom: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        sexe: {
            type: DataTypes.STRING(10), // M ou F
            allowNull: false
        },
        cin: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        date_naissance: {
            type: DataTypes.DATEONLY, // Format YYYY-MM-DD
            allowNull: true
        },
        photo_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 'default-avatar.png' // Optionnel : une image par défaut
        },
        lieu_naissance: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        date_cin: {
            type: DataTypes.DATEONLY, // DATEONLY car on n'a pas besoin de l'heure
            allowNull: true
        },
        lieu_cin: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        date_adhesion: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        promotion: {
            type: DataTypes.STRING(100), // Ex: "Promotion 2026" ou "Alpha"
            allowNull: true
        },
        login_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue:0 }
    }, {
        timestamps: true // Crée automatiquement createdAt et updatedAt login_id
    });

    return MembreIdentite;
};