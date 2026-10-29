const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const criteriaRoutes = require('./routes/criteriaRoutes');
const { adminRouter: judgeInviteAdminRoutes, publicRouter: judgeInvitePublicRoutes } = require('./routes/judgeInviteRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const scoringsSummaryRoutes = require('./routes/scoringsSummaryRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/teams', teamRoutes);
app.use('/api/events/:eventId/criteria', criteriaRoutes);
app.use('/api/events/:eventId', scoreRoutes);
app.use('/api/events/:eventId', scoringsSummaryRoutes);
app.use('/api/events/:eventId/judge-invite', judgeInviteAdminRoutes);
app.use('/api/judge-invite', judgeInvitePublicRoutes);

app.use(errorHandler);

module.exports = app;
