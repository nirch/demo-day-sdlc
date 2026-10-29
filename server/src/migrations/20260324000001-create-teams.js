'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      members: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      demo_presentation_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      live_app_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    await queryInterface.addIndex('teams', ['event_id']);
    await queryInterface.addIndex('teams', ['event_id', 'name'], {
      unique: true,
      name: 'teams_event_id_name_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teams');
  },
};
