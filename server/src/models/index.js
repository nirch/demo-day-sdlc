const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  ...(dbConfig.dialectOptions && { dialectOptions: dbConfig.dialectOptions }),
});

const User = require('./User')(sequelize);
const Event = require('./Event')(sequelize);
const Team = require('./Team')(sequelize);
const Criterion = require('./Criterion')(sequelize);
const EventJudge = require('./EventJudge')(sequelize);
const Score = require('./Score')(sequelize);
const TeamComment = require('./TeamComment')(sequelize);

User.hasMany(Event, { foreignKey: 'created_by', as: 'events' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Event.hasMany(Team, { foreignKey: 'event_id', as: 'teams' });
Team.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Criterion, { foreignKey: 'event_id', as: 'criteria' });
Criterion.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.belongsToMany(User, { through: EventJudge, foreignKey: 'event_id', otherKey: 'user_id', as: 'judges' });
User.belongsToMany(Event, { through: EventJudge, foreignKey: 'user_id', otherKey: 'event_id', as: 'judgedEvents' });
EventJudge.belongsTo(Event, { foreignKey: 'event_id' });
EventJudge.belongsTo(User, { foreignKey: 'user_id' });

Score.belongsTo(Event, { foreignKey: 'event_id' });
Score.belongsTo(Team, { foreignKey: 'team_id' });
Score.belongsTo(Criterion, { foreignKey: 'criterion_id' });
Score.belongsTo(User, { foreignKey: 'judge_id', as: 'judge' });

TeamComment.belongsTo(Event, { foreignKey: 'event_id' });
TeamComment.belongsTo(Team, { foreignKey: 'team_id' });
TeamComment.belongsTo(User, { foreignKey: 'judge_id', as: 'judge' });

module.exports = { sequelize, User, Event, Team, Criterion, EventJudge, Score, TeamComment };
