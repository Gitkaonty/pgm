module.exports = (sequelize, DataTypes) => {
    const MembreUpdate = sequelize.define('membres_updates', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        membre_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'membres', // Nom de la table parente
                key: 'id'
            }
        },
        date_edition: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW
        },
        date_modification: {
            type: DataTypes.DATEONLY
        },
        membre_active: {
            type: DataTypes.ENUM('Oui', 'Non'),
            defaultValue: 'Oui'
        },
        situation: {
            type: DataTypes.ENUM('En activité', 'Inactive', 'Suspendu')
        },
        email_oecfm: DataTypes.STRING,
        adresse: DataTypes.TEXT,
        ville: DataTypes.STRING,
        code_postal: DataTypes.STRING,
        boite_postale: DataTypes.STRING,
        telephone: DataTypes.STRING,
        fax: DataTypes.STRING,
        email_personnel: DataTypes.STRING,
        email_professionnel: DataTypes.STRING,
        poste: {
            type: DataTypes.ENUM('Caissier','Conseiller', 'Membre', 'Président','Président d honneur', 'Vice-Président Administratif', 'Vice-Président Technique','Secrétaire Exécutif','Secrétaire Général', 'Secrétaire Général Adjoint', 'Trésorier')
        },
        region: DataTypes.STRING,
        section: {
            type: DataTypes.ENUM('Expert Comptable', 'Société Expert')
        },
        statut: {
            type: DataTypes.ENUM('Expert Comptable', 'Expert Stagiaire')
        },
        titre: {
            type: DataTypes.ENUM('Tableau A', 'Tableau B')
        },
        num_compte: DataTypes.STRING,
        nombre_associe: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'membres_updates',
        timestamps: true, // Pour created_at et updated_at
        underscored: true // Pour utiliser des noms comme membre_id au lieu de membreId
    });

    return MembreUpdate;
};