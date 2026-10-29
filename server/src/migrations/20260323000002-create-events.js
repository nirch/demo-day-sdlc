'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE TYPE \"enum_events_status\" AS ENUM ('draft', 'active', 'completed');"
    );

    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: '"enum_events_status"',
        allowNull: false,
        defaultValue: 'draft',
      },
      time_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('events', ['created_by']);
    await queryInterface.addIndex('events', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_status";');
  },
};
