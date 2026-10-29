const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Score = sequelize.define('Score', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'events', key: 'id' },
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'teams', key: 'id' },
    },
    criterion_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'criteria', key: 'id' },
    },
    judge_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
  }, {
    tableName: 'scores',
    underscored: true,
  });

  return Score;
};
