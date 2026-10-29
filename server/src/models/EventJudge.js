const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventJudge = sequelize.define('EventJudge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'event_judges',
    underscored: true,
  });

  return EventJudge;
};
