'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('autres_appels', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      exercice_id: { type: Sequelize.INTEGER, allowNull: false },
      membre_id: { type: Sequelize.INTEGER, allowNull: false },
      montant_autre: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      motif: { type: Sequelize.STRING(255), allowNull: false },
      type_autre: { type: Sequelize.STRING, defaultValue: 'AUTRE_APPEL' },
      date_autre: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      section: { type: Sequelize.STRING },
      statut: { type: Sequelize.STRING },
      titre: { type: Sequelize.STRING },
      etat: { type: Sequelize.STRING, defaultValue: 'En attente' },
      valide: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('autres_appels', ['exercice_id']);
    await queryInterface.addIndex('autres_appels', ['membre_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('autres_appels');
  }
};
