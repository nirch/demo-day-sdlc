'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scores', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      criterion_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'criteria', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      judge_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addConstraint('scores', {
      fields: ['value'],
      type: 'check',
      name: 'scores_value_range',
      where: { value: { [Sequelize.Op.between]: [1, 5] } },
    });

    await queryInterface.addIndex('scores', ['team_id', 'criterion_id', 'judge_id'], {
      unique: true,
      name: 'scores_team_criterion_judge_unique',
    });

    await queryInterface.addIndex('scores', ['event_id', 'judge_id'], {
      name: 'scores_event_judge_idx',
    });

    await queryInterface.addIndex('scores', ['team_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('scores');
  },
};
