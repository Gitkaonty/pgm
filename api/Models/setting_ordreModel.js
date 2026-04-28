module.exports = (sequelize, Sequelize) => {
    const SettingsOrdre = sequelize.define("settings_ordre", {
        adresse: { type: Sequelize.TEXT },
        boite_postale: { type: Sequelize.STRING },
        telephone: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        site_web: { type: Sequelize.STRING },
        sig_president: { type: Sequelize.STRING },
        sig_secretaire: { type: Sequelize.STRING },
        sig_tresorier: { type: Sequelize.STRING },
        sig_vice_president_admin: { type: Sequelize.STRING },
        sig_caissier: { type: Sequelize.STRING },
    }, {
        freezeTableName: true,
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: false
    });

    return SettingsOrdre;
};