'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'sort_order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Backfill existing teams: assign sort_order based on created_at order per event
    await queryInterface.sequelize.query(`
      UPDATE teams
      SET sort_order = sub.row_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at ASC) - 1 AS row_num
        FROM teams
      ) AS sub
      WHERE teams.id = sub.id
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teams', 'sort_order');
  },
};
