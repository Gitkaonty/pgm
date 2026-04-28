module.exports = (sequelize, Sequelize) => {
    const EmailLog = sequelize.define("email_logsappel", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        paiement_id: { type: Sequelize.INTEGER, allowNull: true }, // Si lié à un reçu
        membre_id: { type: Sequelize.INTEGER, allowNull: false },
        email_dest: { type: Sequelize.STRING, allowNull: false },
        date_envoi: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        statut: { type: Sequelize.STRING }, // 'Succès' ou 'Échec'
        message_erreur: { type: Sequelize.TEXT, allowNull: true },
        expediteur_id: { type: Sequelize.INTEGER } // Optionnel: ID de l'utilisateur qui a cliqué
    }, {
        tableName: 'email_logsappel',
        timestamps: true,
        underscored: true
    });

    return EmailLog;
};