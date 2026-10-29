const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamComment = sequelize.define('TeamComment', {
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
    judge_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'team_comments',
    underscored: true,
  });

  return TeamComment;
};
