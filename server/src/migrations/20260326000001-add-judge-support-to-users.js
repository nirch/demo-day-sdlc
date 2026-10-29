'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'judge' to the role enum — must run outside a transaction in PostgreSQL
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_users_role\" ADD VALUE 'judge';"
    );

    // Make password nullable (judges have no password)
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Make email nullable (judges have no email)
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Add judge-specific columns
    await queryInterface.addColumn('users', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'company', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'company');
    await queryInterface.removeColumn('users', 'title');
    await queryInterface.removeColumn('users', 'name');

    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Note: PostgreSQL does not support removing values from an enum type.
    // The 'judge' value will remain in enum_users_role after rollback.
  },
};
