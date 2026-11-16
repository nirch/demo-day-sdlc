'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'winner_team_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'teams', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('events', 'winner_team_id');
  },
};
